import type { SupportContext } from '@shared/lib/validation/support'
import { sortMessages, type ThreadMessage } from './thread'

/**
 * How a ticket reads in the admin chat. Pure, so the one rule that matters can
 * be checked directly: the email never appears. A name and an id are enough to
 * find someone in the database; the address is not needed to answer a question.
 */

const SOURCE_LABEL: Record<string, string> = {
  web: 'сайт',
  bot: 'бот',
}

/** How many earlier messages a follow-up carries with it, newest of the old last. */
const HISTORY_LINES = 4

function contextLine(context: SupportContext | null): string {
  if (!context) return 'Контекст: нет'

  const parts = [
    context.appVersion,
    context.standalone ? 'PWA' : 'браузер',
    context.hasCar ? 'машина есть' : 'машины нет',
  ]
  if (context.userAgent) parts.push(context.userAgent)

  return `Контекст: ${parts.join(' · ')}`
}

function historyBlock(history: ThreadMessage[]): string {
  const recent = sortMessages(history).slice(-HISTORY_LINES)
  if (!recent.length) return ''

  const lines = recent.map((m) => `${m.author === 'ADMIN' ? '↩︎ ты' : '👤 он'}: ${m.text}`)
  return `\n\nРанее в переписке:\n${lines.join('\n')}`
}

export interface TicketNotification {
  ticketId: string
  /** Name and id — deliberately not the email. */
  user: { id: string; name: string | null }
  source: string
  context: SupportContext | null
  text: string
  /** Everything already said in this thread. Empty for a first message. */
  history?: ThreadMessage[]
}

export function formatTicketNotification(n: TicketNotification): string {
  const heading = n.history?.length ? '💬 Новое сообщение в обращении' : '🆘 Новое обращение'

  return (
    `${heading} #${n.ticketId.slice(-6)}\n` +
    `От: ${n.user.name ?? 'без имени'} (${n.user.id})\n` +
    `Источник: ${SOURCE_LABEL[n.source] ?? n.source}\n` +
    `${contextLine(n.context)}` +
    historyBlock(n.history ?? []) +
    `\n\n${n.text}\n\n` +
    'Ответь реплаем на это сообщение — ответ уйдёт пользователю.'
  )
}
