import { describe, it, expect } from 'vitest'
import { maintenanceSchema } from './schema'

/**
 * MaintenanceDialog seeds `lastServiceDate` with '' for every new item and for
 * every existing item that has never been serviced, so this is the resting state
 * of the form, not an edge case.
 */
describe('maintenanceSchema', () => {
  const base = { name: 'Масло', intervalKm: 10_000, lastServiceNotes: '' }

  it('accepts an item whose optional last-service date is blank', () => {
    expect(maintenanceSchema.safeParse({ ...base, lastServiceDate: '' }).success).toBe(true)
  })

  it('accepts a past last-service date', () => {
    expect(maintenanceSchema.safeParse({ ...base, lastServiceDate: '2024-03-01' }).success).toBe(true)
  })

  it('rejects a last-service date in the future', () => {
    expect(maintenanceSchema.safeParse({ ...base, lastServiceDate: '2030-01-01' }).success).toBe(false)
  })

  it('still requires an interval of one kind or the other', () => {
    expect(maintenanceSchema.safeParse({ name: 'Масло', lastServiceDate: '' }).success).toBe(false)
  })
})
