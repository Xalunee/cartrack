import { describe, it, expect } from 'vitest'
import { calculateProfileStats } from './profile-stats'

const NOW = new Date('2026-08-21T12:00:00Z')

function stats(overrides: Partial<Parameters<typeof calculateProfileStats>[0]> = {}) {
  return calculateProfileStats({
    logs: [],
    spentPerItem: [],
    trackingStartedAt: null,
    now: NOW,
    ...overrides,
  })
}

describe('calculateProfileStats', () => {
  it('measures tracked distance between the lowest and highest reading', () => {
    const result = stats({
      logs: [
        { mileage: 120_000, recordedAt: '2026-08-01T00:00:00Z' },
        { mileage: 100_000, recordedAt: '2026-01-01T00:00:00Z' },
        { mileage: 110_000, recordedAt: '2026-04-01T00:00:00Z' },
      ],
    })
    expect(result.trackedKm).toBe(20_000)
    expect(result.readingsCount).toBe(3)
  })

  it('reports zero distance for a single reading, not null', () => {
    expect(stats({ logs: [{ mileage: 90_000, recordedAt: NOW }] }).trackedKm).toBe(0)
  })

  it('has no distance to report with no readings', () => {
    expect(stats().trackedKm).toBeNull()
    expect(stats().readingsCount).toBe(0)
  })

  it('sums what every maintenance item cost', () => {
    expect(stats({ spentPerItem: [4500, 0, 12_300] }).totalSpent).toBe(16_800)
  })

  it('counts days from the car creation date', () => {
    expect(stats({ trackingStartedAt: '2026-08-01T00:00:00Z' }).trackedDays).toBe(20)
  })

  it('falls back to the earliest reading when the car date is unknown', () => {
    const result = stats({
      logs: [
        { mileage: 100_000, recordedAt: '2026-07-22T00:00:00Z' },
        { mileage: 101_000, recordedAt: '2026-08-10T00:00:00Z' },
      ],
    })
    expect(result.trackedDays).toBe(30)
  })

  it('prefers whichever start came first', () => {
    const result = stats({
      trackingStartedAt: '2026-08-11T00:00:00Z',
      logs: [{ mileage: 100_000, recordedAt: '2026-08-01T00:00:00Z' }],
    })
    expect(result.trackedDays).toBe(20)
  })

  it('never reports negative days when the start is in the future', () => {
    const result = stats({ trackingStartedAt: '2026-09-01T00:00:00Z' })
    expect(result.trackedDays).toBe(0)
    expect(result.trackedSince).toEqual(NOW)
  })

  it('exposes the chosen start so long spans can be formatted', () => {
    expect(stats({ trackingStartedAt: '2026-08-01T00:00:00Z' }).trackedSince)
      .toEqual(new Date('2026-08-01T00:00:00Z'))
  })

  it('has no day count before the car is loaded', () => {
    expect(stats().trackedDays).toBeNull()
    expect(stats().trackedSince).toBeNull()
  })

  it('ignores readings with an unparsable date when picking the start', () => {
    const result = stats({
      trackingStartedAt: '2026-08-01T00:00:00Z',
      logs: [{ mileage: 100_000, recordedAt: 'not-a-date' }],
    })
    expect(result.trackedDays).toBe(20)
  })
})
