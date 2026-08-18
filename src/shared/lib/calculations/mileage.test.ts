import { describe, it, expect } from 'vitest'
import { calculateDrivingPace } from '@shared/lib/calculations/mileage'

/** Build a log entry N days after a fixed epoch, so tests never depend on today. */
const EPOCH = new Date('2026-01-01T00:00:00.000Z')
function log(dayOffset: number, mileage: number) {
  return {
    mileage,
    recordedAt: new Date(EPOCH.getTime() + dayOffset * 86_400_000),
  }
}

describe('calculateDrivingPace', () => {
  describe('insufficient data', () => {
    it('returns null for an empty list', () => {
      expect(calculateDrivingPace([])).toBeNull()
    })

    it('returns null for a single log', () => {
      expect(calculateDrivingPace([log(0, 10_000)])).toBeNull()
    })

    it('returns null when all logs are on the same day (diffDays < 1)', () => {
      const sameDay = [
        { mileage: 10_000, recordedAt: new Date('2026-01-01T08:00:00.000Z') },
        { mileage: 10_050, recordedAt: new Date('2026-01-01T20:00:00.000Z') },
      ]
      expect(calculateDrivingPace(sameDay)).toBeNull()
    })

    it('returns null when the span is just under one day', () => {
      const almost = [
        { mileage: 10_000, recordedAt: new Date('2026-01-01T00:00:00.000Z') },
        { mileage: 10_050, recordedAt: new Date('2026-01-01T23:59:00.000Z') },
      ]
      expect(calculateDrivingPace(almost)).toBeNull()
    })

    it('accepts a span of exactly one day', () => {
      const exact = [log(0, 10_000), log(1, 10_050)]
      expect(calculateDrivingPace(exact)).not.toBeNull()
    })
  })

  describe('normal sequences', () => {
    it('computes a sensible km/day and km/week from an ascending series', () => {
      // +50 km/day, perfectly linear
      const pace = calculateDrivingPace([
        log(0, 10_000),
        log(10, 10_500),
        log(20, 11_000),
      ])
      expect(pace).not.toBeNull()
      expect(pace!.kmPerDay).toBeCloseTo(50, 10)
      expect(pace!.kmPerWeek).toBeCloseTo(350, 10)
      expect(pace!.basedOnLogs).toBe(3)
    })

    it('derives kmPerWeek as exactly 7x kmPerDay', () => {
      const pace = calculateDrivingPace([log(0, 0), log(3, 137), log(9, 401)])
      expect(pace!.kmPerWeek).toBeCloseTo(pace!.kmPerDay * 7, 10)
    })

    it('reports a flat odometer as zero pace, not null', () => {
      const pace = calculateDrivingPace([log(0, 10_000), log(5, 10_000)])
      expect(pace).not.toBeNull()
      expect(pace!.kmPerDay).toBe(0)
      expect(pace!.kmPerWeek).toBe(0)
    })

    it('uses least-squares, so one odd point does not swing the estimate', () => {
      // Mostly 100 km/day, with one flat stretch in the middle.
      const pace = calculateDrivingPace([
        log(0, 0),
        log(1, 100),
        log(2, 100), // sat still a day
        log(3, 300),
        log(4, 400),
      ])
      expect(pace!.kmPerDay).toBeGreaterThan(80)
      expect(pace!.kmPerDay).toBeLessThan(120)
    })
  })

  describe('ordering', () => {
    it('sorts out-of-order input by date before computing', () => {
      const ordered = [log(0, 10_000), log(10, 10_500), log(20, 11_000)]
      const shuffled = [ordered[2], ordered[0], ordered[1]]
      expect(calculateDrivingPace(shuffled)).toEqual(calculateDrivingPace(ordered))
    })

    it('is order-independent for a longer shuffled series', () => {
      const ordered = [
        log(0, 1_000),
        log(4, 1_200),
        log(8, 1_500),
        log(15, 1_900),
        log(22, 2_300),
      ]
      const shuffled = [ordered[3], ordered[0], ordered[4], ordered[1], ordered[2]]
      const a = calculateDrivingPace(shuffled)!
      const b = calculateDrivingPace(ordered)!
      expect(a.kmPerDay).toBeCloseTo(b.kmPerDay, 10)
      expect(a.basedOnLogs).toBe(b.basedOnLogs)
    })
  })

  describe('backdated insertion', () => {
    it('a valid point inserted between two existing ones does not distort the pace', () => {
      const before = calculateDrivingPace([log(0, 10_000), log(20, 11_000)])!
      // 10_500 at day 10 sits exactly on the existing slope.
      const after = calculateDrivingPace([
        log(0, 10_000),
        log(20, 11_000),
        log(10, 10_500),
      ])!
      expect(after.kmPerDay).toBeCloseTo(before.kmPerDay, 10)
      expect(after.basedOnLogs).toBe(3)
    })

    it('a slightly-off backdated point moves the pace only marginally', () => {
      const before = calculateDrivingPace([log(0, 10_000), log(20, 11_000)])!
      const after = calculateDrivingPace([
        log(0, 10_000),
        log(20, 11_000),
        log(10, 10_600), // 100 km above the line
      ])!
      expect(Math.abs(after.kmPerDay - before.kmPerDay)).toBeLessThan(10)
    })
  })

  describe('impossible decreases', () => {
    it('drops a point whose mileage is below an earlier-dated log', () => {
      const pace = calculateDrivingPace([
        log(0, 10_000),
        log(10, 9_000), // impossible: odometer went backwards
        log(20, 11_000),
      ])!
      // The bad point is filtered, leaving the two good ones.
      expect(pace.basedOnLogs).toBe(2)
      expect(pace.kmPerDay).toBeCloseTo(50, 10)
    })

    it('never returns a negative pace for a fully descending series', () => {
      const pace = calculateDrivingPace([
        log(0, 20_000),
        log(10, 15_000),
        log(20, 10_000),
      ])
      // Every later point is below the running max, so only the first survives.
      expect(pace).toBeNull()
    })

    it('keeps points with mileage equal to the running max', () => {
      const pace = calculateDrivingPace([
        log(0, 10_000),
        log(5, 10_000),
        log(10, 10_500),
      ])!
      expect(pace.basedOnLogs).toBe(3)
      expect(pace.kmPerDay).toBeGreaterThanOrEqual(0)
    })

    it('returns null when filtering leaves fewer than 2 points', () => {
      expect(calculateDrivingPace([log(0, 10_000), log(5, 1)])).toBeNull()
    })

    it('returns null when the surviving points span less than a day', () => {
      // The day-10 point is dropped, leaving two points 12h apart.
      const logs = [
        { mileage: 10_000, recordedAt: new Date('2026-01-01T00:00:00.000Z') },
        { mileage: 10_100, recordedAt: new Date('2026-01-01T12:00:00.000Z') },
        { mileage: 500, recordedAt: new Date('2026-01-11T00:00:00.000Z') },
      ]
      expect(calculateDrivingPace(logs)).toBeNull()
    })

    it.each([
      ['descending pair', [log(0, 5_000), log(30, 4_000)]],
      ['zig-zag', [log(0, 100), log(5, 50), log(10, 120), log(15, 60)]],
      ['reset to zero', [log(0, 90_000), log(10, 0), log(20, 100)]],
      ['duplicate timestamps', [log(0, 100), log(0, 90), log(9, 300)]],
    ])('pace is never negative: %s', (_label, logs) => {
      const pace = calculateDrivingPace(logs)
      if (pace) {
        expect(pace.kmPerDay).toBeGreaterThanOrEqual(0)
        expect(pace.kmPerWeek).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('window limit', () => {
    it('uses at most the 8 most recent logs', () => {
      // 12 logs, 10 km/day.
      const logs = Array.from({ length: 12 }, (_, i) => log(i, i * 10))
      const pace = calculateDrivingPace(logs)!
      expect(pace.basedOnLogs).toBe(8)
    })

    it('ignores logs outside the window entirely', () => {
      // Ancient history at a wildly different pace, then 8 recent logs at 10 km/day.
      const ancient = [log(-400, 0), log(-390, 40_000)]
      const recent = Array.from({ length: 8 }, (_, i) => log(i, 50_000 + i * 10))
      const pace = calculateDrivingPace([...ancient, ...recent])!
      expect(pace.basedOnLogs).toBe(8)
      expect(pace.kmPerDay).toBeCloseTo(10, 10)
    })

    it('slices the most recent logs, not the oldest', () => {
      // Oldest 8 are flat; newest 8 climb at 100 km/day.
      const flat = Array.from({ length: 8 }, (_, i) => log(i, 1_000))
      const climbing = Array.from({ length: 8 }, (_, i) => log(20 + i, 1_000 + i * 100))
      const pace = calculateDrivingPace([...flat, ...climbing])!
      expect(pace.kmPerDay).toBeCloseTo(100, 10)
    })
  })

  describe('input safety', () => {
    it('does not mutate or reorder the caller array', () => {
      const logs = [log(20, 11_000), log(0, 10_000), log(10, 10_500)]
      const snapshot = logs.map((l) => ({ ...l }))
      calculateDrivingPace(logs)
      expect(logs).toEqual(snapshot)
    })
  })
})
