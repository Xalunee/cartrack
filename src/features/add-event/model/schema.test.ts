import { describe, it, expect } from 'vitest'
import { addEventSchema } from './schema'

describe('addEventSchema', () => {
  const base = { type: 'NOTE' as const, title: 'Заметка' }

  it('accepts a cleared date field', () => {
    expect(addEventSchema.safeParse({ ...base, occurredAt: '' }).success).toBe(true)
  })

  it('rejects an event dated in the future', () => {
    expect(addEventSchema.safeParse({ ...base, occurredAt: '2030-01-01' }).success).toBe(false)
  })
})
