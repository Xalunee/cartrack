import { describe, expect, it } from 'vitest'
import { formatTicketNotification } from './admin-message'

const base = {
  ticketId: 'clx0000000000abcdef',
  user: { id: 'user_1', name: 'Аидар' },
  source: 'web',
  context: { appVersion: 'a1b2c3d', standalone: true, hasCar: true, userAgent: 'Safari/17' },
  text: 'Не приходят напоминания',
}

describe('formatTicketNotification', () => {
  it('names the person and the source without leaking an email', () => {
    const text = formatTicketNotification(base)
    expect(text).toContain('Аидар')
    expect(text).toContain('user_1')
    expect(text).toContain('Источник: сайт')
    expect(text).not.toMatch(/@/)
  })

  it('folds the technical context onto one line', () => {
    expect(formatTicketNotification(base)).toContain(
      'Контекст: a1b2c3d · PWA · машина есть · Safari/17'
    )
  })

  it('says a browser and a missing car just as plainly', () => {
    const text = formatTicketNotification({
      ...base,
      context: { appVersion: 'dev', standalone: false, hasCar: false },
    })
    expect(text).toContain('Контекст: dev · браузер · машины нет')
  })

  it('survives a ticket with no context at all', () => {
    expect(formatTicketNotification({ ...base, context: null })).toContain('Контекст: нет')
  })

  it('spells out that a reply is the way to answer', () => {
    expect(formatTicketNotification(base)).toContain('Ответь реплаем')
  })

  it('marks a follow-up as such and carries the thread with it', () => {
    const text = formatTicketNotification({
      ...base,
      text: 'всё ещё не приходят',
      history: [
        { author: 'USER', text: 'Не приходят напоминания', createdAt: '2026-08-01T10:00:00Z' },
        { author: 'ADMIN', text: 'Проверь привязку', createdAt: '2026-08-01T11:00:00Z' },
      ],
    })

    expect(text).toContain('Новое сообщение в обращении')
    expect(text).toContain('Ранее в переписке:')
    expect(text).toContain('👤 он: Не приходят напоминания')
    expect(text).toContain('↩︎ ты: Проверь привязку')
    expect(text).toContain('всё ещё не приходят')
  })

  it('keeps only the tail of a long thread', () => {
    const history = Array.from({ length: 9 }, (_, i) => ({
      author: 'USER' as const,
      text: `сообщение ${i}`,
      createdAt: new Date(2026, 7, 1, i).toISOString(),
    }))

    const text = formatTicketNotification({ ...base, history })
    expect(text).not.toContain('сообщение 4')
    expect(text).toContain('сообщение 5')
    expect(text).toContain('сообщение 8')
  })
})
