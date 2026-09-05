import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPeriodStart } from './period'

function at(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

afterEach(() => {
  vi.useRealTimers()
})

/** Local time, because the periods are anchored to the user's calendar. */
function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('getPeriodStart', () => {
  it('starts the month on the 1st, not a month back from today', () => {
    at('2026-09-05T08:00:00')
    expect(localDate(getPeriodStart('month'))).toBe('2026-09-01')
  })

  it('counts the current month as one of the six', () => {
    at('2026-09-05T08:00:00')
    expect(localDate(getPeriodStart('halfyear'))).toBe('2026-04-01')
  })

  it('counts the current month as one of the twelve', () => {
    at('2026-09-05T08:00:00')
    expect(localDate(getPeriodStart('year'))).toBe('2025-10-01')
  })

  it('starts at the very beginning of the 1st, not at the current time of day', () => {
    at('2026-09-05T23:59:00')
    const start = getPeriodStart('month')
    expect(localDate(start)).toBe('2026-09-01')
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()])
      .toEqual([0, 0, 0, 0])
    // A record logged just after midnight on the 1st belongs to the month.
    expect(new Date('2026-09-01T00:30:00').getTime()).toBeGreaterThan(start.getTime())
  })

  it('keeps the periods nested in January, where year-to-date would invert them', () => {
    at('2027-01-15T08:00:00')
    const [month, halfyear, year] = (['month', 'halfyear', 'year'] as const).map(getPeriodStart)
    expect(localDate(month)).toBe('2027-01-01')
    expect(localDate(halfyear)).toBe('2026-08-01')
    expect(localDate(year)).toBe('2026-02-01')
    expect(year.getTime()).toBeLessThan(halfyear.getTime())
    expect(halfyear.getTime()).toBeLessThan(month.getTime())
  })

  it('ignores the day of the month it is called on', () => {
    at('2026-03-31T08:00:00')
    expect(localDate(getPeriodStart('month'))).toBe('2026-03-01')
    expect(localDate(getPeriodStart('halfyear'))).toBe('2025-10-01')
    expect(localDate(getPeriodStart('year'))).toBe('2025-04-01')
  })

  it('holds on a leap day', () => {
    at('2028-02-29T08:00:00')
    expect(localDate(getPeriodStart('month'))).toBe('2028-02-01')
    expect(localDate(getPeriodStart('halfyear'))).toBe('2027-09-01')
  })
})
