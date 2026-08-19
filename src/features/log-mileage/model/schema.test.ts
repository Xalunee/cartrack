import { describe, it, expect } from 'vitest'
import { historyMileageSchema, logMileageSchema } from './schema'

describe('logMileageSchema', () => {
  it('accepts a cleared date field in the edit form', () => {
    expect(logMileageSchema.safeParse({ mileage: 1000, recordedAt: '' }).success).toBe(true)
  })

  it('rejects a reading dated in the future', () => {
    expect(logMileageSchema.safeParse({ mileage: 1000, recordedAt: '2030-01-01' }).success).toBe(false)
  })
})

describe('historyMileageSchema', () => {
  it('keeps the date required — a backdated entry has to say when', () => {
    expect(historyMileageSchema.safeParse({ mileage: 1000, recordedAt: '' }).success).toBe(false)
    expect(historyMileageSchema.safeParse({ mileage: 1000, recordedAt: '2024-03-01' }).success).toBe(true)
  })
})
