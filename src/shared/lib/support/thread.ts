/**
 * A ticket has no status column. Its state is whatever the conversation says it
 * is: the last word belongs to the user and someone owes them an answer, or it
 * belongs to the admin and it does not. Deriving it means the two can never
 * disagree — there is nothing to keep in sync.
 */
export type SupportAuthorName = 'USER' | 'ADMIN'

export interface ThreadMessage {
  author: SupportAuthorName
  text: string
  createdAt: string | Date
}

export type TicketState = 'pending' | 'answered'

function time(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

/** Oldest first — the order a conversation is read in. */
export function sortMessages<T extends ThreadMessage>(messages: T[]): T[] {
  return [...messages].sort((a, b) => time(a.createdAt) - time(b.createdAt))
}

export function lastMessage<T extends ThreadMessage>(messages: T[]): T | undefined {
  return sortMessages(messages).at(-1)
}

/**
 * An empty thread cannot happen — a ticket is only ever created together with
 * its first message — but if it somehow does, nobody has answered it.
 */
export function ticketState(messages: ThreadMessage[]): TicketState {
  return lastMessage(messages)?.author === 'ADMIN' ? 'answered' : 'pending'
}

/** The line a collapsed ticket row is identified by: what they first wrote. */
export function openingLine(messages: ThreadMessage[]): string {
  return sortMessages(messages)[0]?.text ?? ''
}
