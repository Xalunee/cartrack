import { describe, expect, it } from 'vitest'
import { matchAdminReply } from './reply-matching'

const ADMIN = '4242'

describe('matchAdminReply', () => {
  it('matches a reply in the admin chat to the message it answers', () => {
    expect(
      matchAdminReply(
        { chat: { id: 4242 }, text: 'уже починили', reply_to_message: { message_id: 17 } },
        ADMIN
      )
    ).toEqual({ kind: 'answer', adminMessageId: '17', text: 'уже починили' })
  })

  it('compares chat ids across the number/string boundary', () => {
    // Telegram sends a number, the environment hands us a string.
    expect(
      matchAdminReply(
        { chat: { id: 4242 }, text: 'ок', reply_to_message: { message_id: 1 } },
        ADMIN
      ).kind
    ).toBe('answer')
  })

  it('ignores any other chat', () => {
    expect(
      matchAdminReply(
        { chat: { id: 999 }, text: 'привет', reply_to_message: { message_id: 17 } },
        ADMIN
      )
    ).toEqual({ kind: 'not_admin' })
  })

  it('ignores everything when no admin chat is configured', () => {
    expect(
      matchAdminReply(
        { chat: { id: 4242 }, text: 'ок', reply_to_message: { message_id: 1 } },
        undefined
      )
    ).toEqual({ kind: 'not_admin' })
  })

  it('ignores a chatless update', () => {
    expect(matchAdminReply(undefined, ADMIN)).toEqual({ kind: 'not_admin' })
    expect(matchAdminReply({ text: 'ок' }, ADMIN)).toEqual({ kind: 'not_admin' })
  })

  it('reports a message in the admin chat that replies to nothing', () => {
    expect(matchAdminReply({ chat: { id: 4242 }, text: 'заметка себе' }, ADMIN)).toEqual({
      kind: 'not_a_reply',
    })
  })

  it('reports a reply with no text — a forwarded photo, say', () => {
    expect(
      matchAdminReply({ chat: { id: 4242 }, reply_to_message: { message_id: 17 } }, ADMIN)
    ).toEqual({ kind: 'empty' })
    expect(
      matchAdminReply(
        { chat: { id: 4242 }, text: '   ', reply_to_message: { message_id: 17 } },
        ADMIN
      )
    ).toEqual({ kind: 'empty' })
  })

  it('trims the answer it hands on', () => {
    const match = matchAdminReply(
      { chat: { id: 4242 }, text: '  готово  ', reply_to_message: { message_id: 8 } },
      ADMIN
    )
    expect(match).toEqual({ kind: 'answer', adminMessageId: '8', text: 'готово' })
  })
})
