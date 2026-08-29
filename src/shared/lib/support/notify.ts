import * as Sentry from '@sentry/nextjs'
import { db } from '@shared/lib/db'
import { sendMessage, sendPhotoDataUrl } from '@shared/lib/telegram/api'
import type { SupportContext } from '@shared/lib/validation/support'
import { formatTicketNotification } from './admin-message'
import { linkAdminMessageId } from './tickets'
import type { ThreadMessage } from './thread'

/**
 * The admin bot is a different bot with a different token: the user bot belongs
 * to the people using the app, and support traffic is not theirs to receive.
 */
export function adminBotToken(): string | undefined {
  return process.env.TELEGRAM_ADMIN_BOT_TOKEN
}

/** The one chat the admin bot ever talks to. */
export function adminChatId(): string | undefined {
  return process.env.TELEGRAM_ADMIN_CHAT_ID
}

/**
 * Notifications are never allowed to take the caller down with them. A ticket
 * that is stored but not announced is a nuisance; a signup or a support form
 * that fails because Telegram is down is a bug.
 */
async function swallow(area: string, fn: () => Promise<void>) {
  try {
    await fn()
  } catch (error) {
    console.error(`[support] ${area} notification failed:`, error)
    Sentry.captureException(error, { tags: { area: 'support', step: area } })
    await Sentry.flush(2000).catch(() => {})
  }
}

interface TicketMessageNotification {
  ticketId: string
  /** The SupportMessage row this notification is about. */
  messageId: string
  user: { id: string; name: string | null }
  source: string
  context: SupportContext | null
  text: string
  /** Everything said before this message. Empty when the ticket is new. */
  history?: ThreadMessage[]
  /** Data URL, forwarded as a photo and then forgotten. */
  screenshot?: string
}

/**
 * Announces a user message in the admin chat and remembers where it landed, so a
 * reply to it can be traced back to this thread. The screenshot goes first, as
 * its own photo message: a caption is limited to 1024 characters, and the ticket
 * text plus context regularly exceeds that.
 */
export async function notifyAdminOfTicketMessage(n: TicketMessageNotification) {
  const token = adminBotToken()
  const chatId = adminChatId()
  if (!token || !chatId) {
    console.warn('[support] admin bot is not configured — notification skipped')
    return
  }

  await swallow('ticket', async () => {
    if (n.screenshot) {
      await sendPhotoDataUrl(token, chatId, n.screenshot, `Скриншот к #${n.ticketId.slice(-6)}`)
    }

    const adminMessageId = await sendMessage(
      token,
      chatId,
      formatTicketNotification({
        ticketId: n.ticketId,
        user: n.user,
        source: n.source,
        context: n.context,
        text: n.text,
        history: n.history,
      })
    )

    await linkAdminMessageId(n.messageId, String(adminMessageId))
  })
}

/**
 * Who joined and how many there are now. The name is here because it is not an
 * identifier — nobody signs in with it — while the email still is, so the email
 * stays out.
 */
export async function notifyAdminOfRegistration(name: string | null) {
  const token = adminBotToken()
  const chatId = adminChatId()
  if (!token || !chatId) return

  await swallow('registration', async () => {
    const total = await db.user.count()
    await sendMessage(
      token,
      chatId,
      `👤 Новая регистрация: ${name?.trim() || 'без имени'}.\nВсего пользователей: ${total}.`
    )
  })
}
