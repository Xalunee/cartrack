import { db } from '@shared/lib/db'
import type { SupportContext } from '@shared/lib/validation/support'

/**
 * Which deploy a report came from. Vercel exposes the commit sha to every
 * runtime; locally there is none, and `dev` is more honest than a version number
 * copied from package.json that nobody bumps.
 */
export function appVersion(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  return sha ? sha.slice(0, 7) : 'dev'
}

/** Everything a ticket needs when it is first opened. */
export interface OpenTicketInput {
  userId: string
  text: string
  source: 'web' | 'bot'
  context: SupportContext
}

/** Ticket plus its whole thread, oldest message first — what every caller wants. */
export const ticketWithThread = {
  include: { messages: { orderBy: { createdAt: 'asc' } } },
} as const

/** The same, plus the person — everything an admin notification needs. */
export const ticketWithThreadAndUser = {
  include: {
    user: true,
    messages: { orderBy: { createdAt: 'asc' } },
  },
} as const

/**
 * A ticket is never created empty: the opening message is written in the same
 * transaction, so a thread whose state cannot be derived does not exist even for
 * an instant.
 */
export async function openTicket(input: OpenTicketInput) {
  return db.supportTicket.create({
    data: {
      userId: input.userId,
      source: input.source,
      context: input.context as unknown as object,
      messages: { create: { author: 'USER', text: input.text } },
    },
    ...ticketWithThreadAndUser,
  })
}

/** A follow-up on a conversation that already exists. */
export async function addUserMessage(ticketId: string, text: string) {
  return db.supportMessage.create({
    data: { ticketId, author: 'USER', text },
  })
}

export async function addAdminMessage(ticketId: string, text: string, adminMessageId: string) {
  return db.supportMessage.create({
    data: { ticketId, author: 'ADMIN', text, adminMessageId },
  })
}

/**
 * Records where a message ended up in the admin chat, so a reply to it can be
 * traced back here. Split from the insert because the Telegram id only exists
 * after the send, and a failed send must not cost us the message.
 */
export async function linkAdminMessageId(messageId: string, adminMessageId: string) {
  await db.supportMessage.update({
    where: { id: messageId },
    data: { adminMessageId },
  })
}

/** Loads the ticket a given admin-chat message belongs to, thread and all. */
export async function findTicketByAdminMessageId(adminMessageId: string) {
  const message = await db.supportMessage.findUnique({
    where: { adminMessageId },
    include: { ticket: ticketWithThreadAndUser },
  })
  return message?.ticket ?? null
}

/** One ticket with everything a notification needs. Ownership is the caller's to check. */
export async function loadTicketForNotification(ticketId: string) {
  return db.supportTicket.findUnique({
    where: { id: ticketId },
    ...ticketWithThreadAndUser,
  })
}

export async function listUserTickets(userId: string) {
  return db.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    ...ticketWithThread,
  })
}
