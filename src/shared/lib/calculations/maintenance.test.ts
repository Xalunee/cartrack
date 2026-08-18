import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calculateRemainingResource } from '@shared/lib/calculations/maintenance'
import type { DrivingPace } from '@shared/types'

const DAY = 86_400_000
/** Frozen "now" for every test in this file. */
const NOW = new Date('2026-06-01T12:00:00.000Z')

/** A date exactly `days` before the frozen now. */
function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY)
}

function pace(kmPerDay: number): DrivingPace {
  return { kmPerDay, kmPerWeek: kmPerDay * 7, basedOnLogs: 5 }
}

const NO_SERVICE = {
  intervalKm: null,
  intervalDays: null,
  lastServiceMileage: null,
  lastServiceDate: null,
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('calculateRemainingResource', () => {
  describe('km-only interval', () => {
    const base = { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 }

    it('computes remaining km', () => {
      const r = calculateRemainingResource(base, 10_400, null)
      expect(r.remainingKm).toBe(600)
      expect(r.remainingDays).toBeNull()
      expect(r.usedPercent).toBe(40)
      expect(r.status).toBe('ok')
    })

    it('reports a full interval remaining right after service', () => {
      const r = calculateRemainingResource(base, 10_000, null)
      expect(r.remainingKm).toBe(1_000)
      expect(r.usedPercent).toBe(0)
      expect(r.status).toBe('ok')
    })

    // Thresholds: ok < 70% <= soon < 90% <= critical
    it.each([
      [10_699, 'ok'],
      [10_700, 'soon'],
      [10_899, 'soon'],
      [10_900, 'critical'],
      [10_999, 'critical'],
      [11_000, 'critical'],
    ])('mileage %i yields status %s', (mileage, status) => {
      expect(calculateRemainingResource(base, mileage, null).status).toBe(status)
    })

    it('treats exactly 70% used as soon, not ok', () => {
      const r = calculateRemainingResource(base, 10_700, null)
      expect(r.usedPercent).toBe(70)
      expect(r.status).toBe('soon')
    })

    it('treats exactly 90% used as critical, not soon', () => {
      const r = calculateRemainingResource(base, 10_900, null)
      expect(r.usedPercent).toBe(90)
      expect(r.status).toBe('critical')
    })

    it('rounds usedPercent for display without shifting the status boundary', () => {
      // 69.9% used rounds to 70 for display but is still below the soon cutoff.
      const r = calculateRemainingResource(base, 10_699, null)
      expect(r.usedPercent).toBe(70)
      expect(r.status).toBe('ok')
    })

    it('ignores a zero interval', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 0, lastServiceMileage: 10_000 },
        10_500,
        null
      )
      expect(r.remainingKm).toBeNull()
      expect(r.status).toBe('ok')
    })

    it('skips the km branch when lastServiceMileage is missing', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000 },
        10_500,
        null
      )
      expect(r.remainingKm).toBeNull()
      expect(r.usedPercent).toBe(0)
    })

    it('handles a lastServiceMileage of zero as real data, not missing data', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 0 },
        400,
        null
      )
      expect(r.remainingKm).toBe(600)
      expect(r.usedPercent).toBe(40)
    })
  })

  describe('days-only interval', () => {
    const base = { ...NO_SERVICE, intervalDays: 100 }

    it('computes remaining days', () => {
      const r = calculateRemainingResource(
        { ...base, lastServiceDate: daysAgo(40) },
        50_000,
        null
      )
      expect(r.remainingDays).toBe(60)
      expect(r.remainingKm).toBeNull()
      expect(r.usedPercent).toBe(40)
      expect(r.status).toBe('ok')
    })

    it.each([
      [69, 'ok'],
      [70, 'soon'],
      [89, 'soon'],
      [90, 'critical'],
      [100, 'critical'],
      [130, 'critical'],
    ])('%i days since service yields status %s', (elapsed, status) => {
      const r = calculateRemainingResource(
        { ...base, lastServiceDate: daysAgo(elapsed) },
        50_000,
        null
      )
      expect(r.status).toBe(status)
    })

    it('skips the days branch when lastServiceDate is missing', () => {
      const r = calculateRemainingResource(base, 50_000, null)
      expect(r.remainingDays).toBeNull()
      expect(r.usedPercent).toBe(0)
    })

    it('accepts a date-like value and does not mutate it', () => {
      const last = daysAgo(30)
      const snapshot = last.getTime()
      calculateRemainingResource({ ...base, lastServiceDate: last }, 50_000, null)
      expect(last.getTime()).toBe(snapshot)
    })
  })

  describe('both intervals set — the worse one wins', () => {
    it('km says ok but days says critical', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(95),
        },
        10_100, // only 10% of the km interval used
        null
      )
      expect(r.remainingKm).toBe(900)
      expect(r.remainingDays).toBe(5)
      expect(r.usedPercent).toBe(95)
      expect(r.status).toBe('critical')
    })

    it('days says ok but km says critical', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(10), // only 10% of the day interval used
        },
        10_950,
        null
      )
      expect(r.remainingKm).toBe(50)
      expect(r.remainingDays).toBe(90)
      expect(r.usedPercent).toBe(95)
      expect(r.status).toBe('critical')
    })

    it('reports both remainders independently regardless of which one drives status', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(50),
        },
        10_200,
        null
      )
      expect(r.remainingKm).toBe(800)
      expect(r.remainingDays).toBe(50)
      expect(r.usedPercent).toBe(50) // days is the worse of 20% and 50%
      expect(r.status).toBe('ok')
    })

    it('stays ok when both intervals are comfortably fresh', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(5),
        },
        10_050,
        null
      )
      expect(r.status).toBe('ok')
      expect(r.usedPercent).toBe(5)
    })
  })

  describe('overdue', () => {
    it('returns negative remaining km and caps usedPercent at 100', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        13_000, // 300% of the interval
        null
      )
      expect(r.remainingKm).toBe(-2_000)
      expect(r.usedPercent).toBe(100)
      expect(r.status).toBe('critical')
    })

    it('returns negative remaining days and caps usedPercent at 100', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalDays: 100, lastServiceDate: daysAgo(250) },
        50_000,
        null
      )
      expect(r.remainingDays).toBe(-150)
      expect(r.usedPercent).toBe(100)
      expect(r.status).toBe('critical')
    })

    it('never reports usedPercent above 100 even when wildly overdue', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 100,
          lastServiceMileage: 0,
          intervalDays: 10,
          lastServiceDate: daysAgo(5_000),
        },
        999_999,
        null
      )
      expect(r.usedPercent).toBeLessThanOrEqual(100)
    })
  })

  describe('no last-service data', () => {
    it('does not crash and returns a sane empty result', () => {
      const r = calculateRemainingResource(NO_SERVICE, 50_000, null)
      expect(r).toEqual({
        remainingKm: null,
        remainingDays: null,
        usedPercent: 0,
        status: 'ok',
        forecastDate: null,
      })
    })

    it('does not crash when intervals are set but no service was ever logged', () => {
      const r = calculateRemainingResource(
        { intervalKm: 10_000, intervalDays: 365, lastServiceMileage: null, lastServiceDate: null },
        50_000,
        pace(50)
      )
      expect(r.remainingKm).toBeNull()
      expect(r.remainingDays).toBeNull()
      expect(r.forecastDate).toBeNull()
      expect(r.status).toBe('ok')
    })

    it('tolerates a current mileage below the last service mileage', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        9_500, // bad data: odometer below last service
        null
      )
      expect(r.remainingKm).toBe(1_500)
      expect(r.usedPercent).toBeLessThanOrEqual(0)
      expect(r.status).toBe('ok')
    })
  })

  describe('forecast date', () => {
    it('lands exactly where the arithmetic says with a known pace', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        10_500, // 500 km remaining
        pace(50) // 10 days away
      )
      expect(r.forecastDate).not.toBeNull()
      expect(r.forecastDate!.getTime()).toBe(NOW.getTime() + 10 * DAY)
    })

    it('forecasts sooner for a faster pace', () => {
      const item = { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 }
      const slow = calculateRemainingResource(item, 10_500, pace(10))!
      const fast = calculateRemainingResource(item, 10_500, pace(100))!
      expect(fast.forecastDate!.getTime()).toBeLessThan(slow.forecastDate!.getTime())
    })

    it('returns no forecast when there is no pace and no day interval', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        10_500,
        null
      )
      expect(r.forecastDate).toBeNull()
    })

    it('falls back to the day-interval due date when there is no pace', () => {
      const last = daysAgo(40)
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalDays: 100, lastServiceDate: last },
        50_000,
        null
      )
      expect(r.forecastDate!.getTime()).toBe(last.getTime() + 100 * DAY)
    })

    it('picks the earlier of the km forecast and the day due date', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(95), // due in 5 days
        },
        10_500,
        pace(50) // km forecast is 10 days out
      )
      expect(r.forecastDate!.getTime()).toBe(NOW.getTime() + 5 * DAY)
    })

    it('keeps the km forecast when it is the earlier of the two', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(10), // due in 90 days
        },
        10_500,
        pace(50) // km forecast is 10 days out
      )
      expect(r.forecastDate!.getTime()).toBe(NOW.getTime() + 10 * DAY)
    })

    it('produces no forecast for an item already overdue on both intervals', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(150),
        },
        12_000, // overdue on km too
        pace(50)
      )
      expect(r.forecastDate).toBeNull()
    })

    it('produces no forecast when overdue on km with no day interval', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        12_000,
        pace(50)
      )
      expect(r.forecastDate).toBeNull()
    })

    it('never forecasts a date in the past', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(150), // overdue on days
        },
        10_500, // still 500 km to go
        pace(50)
      )
      // The overdue day interval must not be offered as a forecast.
      expect(r.forecastDate!.getTime()).toBeGreaterThan(NOW.getTime())
      expect(r.forecastDate!.getTime()).toBe(NOW.getTime() + 10 * DAY)
    })

    it('produces no forecast at exactly zero remaining km', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        11_000, // remainingKm === 0
        pace(50)
      )
      expect(r.forecastDate).toBeNull()
    })

    // calculateDrivingPace legitimately returns kmPerDay: 0 for a flat odometer
    // (the same reading on two different days), so the km forecast has to survive
    // a zero divisor rather than producing Infinity days out.
    it('returns no km forecast when the pace is zero', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        10_500,
        pace(0)
      )
      expect(r.forecastDate).toBeNull()
    })

    it('never returns an Invalid Date as a forecast', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        10_500,
        pace(0)
      )
      expect(r.forecastDate === null || !Number.isNaN(r.forecastDate.getTime())).toBe(true)
    })

    it('keeps the day-interval forecast when the pace is zero', () => {
      const last = daysAgo(40)
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: last, // due in 60 days — a perfectly good forecast
        },
        10_500,
        pace(0)
      )
      expect(r.forecastDate!.getTime()).toBe(last.getTime() + 100 * DAY)
    })

    it('computes status and usedPercent independently of the forecast', () => {
      // Zero pace, both intervals set: the forecast is unavailable from the km
      // side, but the status logic must not be affected by that at all.
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(95), // 95% used — the worse of the two
        },
        10_500, // 50% of the km interval used
        pace(0)
      )
      expect(r.usedPercent).toBe(95)
      expect(r.status).toBe('critical')
      expect(r.remainingKm).toBe(500)
      expect(r.remainingDays).toBe(5)
      // The day interval is still in the future, so it supplies the forecast.
      expect(r.forecastDate!.getTime()).toBe(NOW.getTime() + 5 * DAY)
    })

    it('returns no forecast at all when a zero pace meets an overdue day interval', () => {
      const r = calculateRemainingResource(
        {
          intervalKm: 1_000,
          lastServiceMileage: 10_000,
          intervalDays: 100,
          lastServiceDate: daysAgo(150), // already overdue
        },
        10_500,
        pace(0)
      )
      expect(r.forecastDate).toBeNull()
      expect(r.status).toBe('critical')
    })

    it('treats a negative pace like a zero pace', () => {
      const r = calculateRemainingResource(
        { ...NO_SERVICE, intervalKm: 1_000, lastServiceMileage: 10_000 },
        10_500,
        pace(-50)
      )
      expect(r.forecastDate).toBeNull()
    })
  })
})
