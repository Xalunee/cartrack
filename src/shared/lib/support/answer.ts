import * as Sentry from '@sentry/nextjs'
import { sendMessage } from '@shared/lib/telegram/api'
import { addAdminMessage } from './tickets'

/**
 * Delivering an answer. The ticket list on /help is the channel that always
 * works — it is where an answer lands for anyone who never linked Telegram — so
 * the message is stored first and pushed second. If the push fails, the answer
 * is still delivered, just not announced.
 */
export interface AnswerTarget {
  id: string
  user: { telegramChatId: string | null }
}

export interface DeliveryResult {
  channels: string[]
  /** Set when a channel was expected to work and did not. */
  failure?: string
}

export const WEB_CHANNEL = 'в списке обращений на сайте'
export const TELEGRAM_CHANNEL = 'в Telegram'

export async function deliverAnswer(
  ticket: AnswerTarget,
  text: string,
  adminMessageId: string
): Promise<DeliveryResult> {
  await addAdminMessage(ticket.id, text, adminMessageId)

  const channels = [WEB_CHANNEL]

  const chatId = ticket.user.telegramChatId
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!chatId || !token) return { channels }

  try {
    await sendMessage(token, chatId, `💬 Ответ поддержки:\n\n${text}`)
    channels.push(TELEGRAM_CHANNEL)
    return { channels }
  } catch (error) {
    // Worth knowing about — a blocked bot and a broken token look the same from
    // the admin chat otherwise.
    console.error('[support] answer delivery to Telegram failed:', error)
    Sentry.captureException(error, { tags: { area: 'support', step: 'answer-delivery' } })
    await Sentry.flush(2000).catch(() => {})
    return { channels, failure: 'в Telegram не ушло — пользователь мог заблокировать бота' }
  }
}
