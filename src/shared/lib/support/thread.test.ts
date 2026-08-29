import { describe, expect, it } from 'vitest'
import { lastMessage, openingLine, sortMessages, ticketState } from './thread'

const at = (iso: string) => new Date(iso)

describe('ticketState', () => {
  it('is pending while the user had the last word', () => {
    expect(
      ticketState([{ author: 'USER', text: 'не работает', createdAt: at('2026-08-01T10:00:00Z') }])
    ).toBe('pending')
  })

  it('is answered once the admin replied', () => {
    expect(
      ticketState([
        { author: 'USER', text: 'не работает', createdAt: at('2026-08-01T10:00:00Z') },
        { author: 'ADMIN', text: 'починил', createdAt: at('2026-08-01T11:00:00Z') },
      ])
    ).toBe('answered')
  })

  it('goes back to pending when the user follows up', () => {
    expect(
      ticketState([
        { author: 'USER', text: 'не работает', createdAt: at('2026-08-01T10:00:00Z') },
        { author: 'ADMIN', text: 'починил', createdAt: at('2026-08-01T11:00:00Z') },
        { author: 'USER', text: 'всё ещё нет', createdAt: at('2026-08-02T09:00:00Z') },
      ])
    ).toBe('pending')
  })

  it('reads order from the timestamps, not from the array', () => {
    expect(
      ticketState([
        { author: 'ADMIN', text: 'починил', createdAt: at('2026-08-01T11:00:00Z') },
        { author: 'USER', text: 'всё ещё нет', createdAt: at('2026-08-02T09:00:00Z') },
      ])
    ).toBe('pending')
  })

  it('treats an empty thread as unanswered', () => {
    expect(ticketState([])).toBe('pending')
  })
})

describe('sortMessages', () => {
  it('orders oldest first and leaves the input alone', () => {
    const input = [
      { author: 'ADMIN' as const, text: 'b', createdAt: at('2026-08-02T00:00:00Z') },
      { author: 'USER' as const, text: 'a', createdAt: at('2026-08-01T00:00:00Z') },
    ]
    expect(sortMessages(input).map((m) => m.text)).toEqual(['a', 'b'])
    expect(input.map((m) => m.text)).toEqual(['b', 'a'])
  })

  it('accepts ISO strings, as they arrive over the wire', () => {
    const messages = [
      { author: 'ADMIN' as const, text: 'b', createdAt: '2026-08-02T00:00:00.000Z' },
      { author: 'USER' as const, text: 'a', createdAt: '2026-08-01T00:00:00.000Z' },
    ]
    expect(lastMessage(messages)?.text).toBe('b')
    expect(openingLine(messages)).toBe('a')
  })
})

describe('openingLine', () => {
  it('is empty for a thread with no messages', () => {
    expect(openingLine([])).toBe('')
  })
})
