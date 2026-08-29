/**
 * Turning "the admin typed something in his chat" into "this is an answer to
 * ticket X" is the one piece of the admin bot with real rules, so it lives here
 * as a pure function over the shape Telegram sends, and is tested directly.
 *
 * The message ids are stored as strings — Telegram ids are numbers, but they are
 * a key here, not an amount, and the column is a string.
 */
export interface IncomingAdminMessage {
  chat?: { id?: number | string }
  text?: string
  reply_to_message?: { message_id?: number }
}

export type ReplyMatch =
  | { kind: 'answer'; adminMessageId: string; text: string }
  /** In the admin chat, but not a reply to anything — nothing to attach it to. */
  | { kind: 'not_a_reply' }
  /** A reply, but with nothing to say. */
  | { kind: 'empty' }
  /** From some other chat: the caller must stay silent. */
  | { kind: 'not_admin' }

/**
 * `adminChatId` is compared as a string on both sides: it arrives from the
 * environment as text and from Telegram as a number, and `'123' === 123` is
 * false in a way that silently disables the whole bot.
 */
export function matchAdminReply(
  message: IncomingAdminMessage | undefined,
  adminChatId: string | undefined
): ReplyMatch {
  if (!message) return { kind: 'not_admin' }

  const chatId = message.chat?.id
  if (!adminChatId || chatId === undefined || String(chatId) !== String(adminChatId)) {
    return { kind: 'not_admin' }
  }

  const repliedTo = message.reply_to_message?.message_id
  if (repliedTo === undefined) return { kind: 'not_a_reply' }

  const text = message.text?.trim() ?? ''
  if (!text) return { kind: 'empty' }

  return { kind: 'answer', adminMessageId: String(repliedTo), text }
}
