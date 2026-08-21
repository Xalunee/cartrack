import { differenceInCalendarDays } from 'date-fns'

/**
 * Everything the profile shows is derived from data the app already loads — the
 * car, the mileage history, and the maintenance items — so there is no endpoint
 * behind this, only arithmetic over three existing queries.
 */
export interface ProfileStatsInput {
  /** Odometer readings, in any order; only their mileages and dates matter. */
  logs: { mileage: number; recordedAt: Date | string }[]
  /** `totalSpent` of each maintenance item. */
  spentPerItem: number[]
  /** When tracking began — the car's creation date. */
  trackingStartedAt: Date | string | null
  now: Date
}

export interface ProfileStats {
  /** Distance covered between the first and the last reading; null with no data. */
  trackedKm: number | null
  readingsCount: number
  totalSpent: number
  /** Whole days since tracking began; null until the car is known. */
  trackedDays: number | null
  /**
   * When tracking began, never later than `now`. Kept alongside `trackedDays` so
   * the UI can spell out long spans ("3 месяца") while `trackedDays` decides the
   * wording for the first day, which no distance format states well.
   */
  trackedSince: Date | null
}

function earliest(logs: ProfileStatsInput['logs']): Date | null {
  const times = logs.map((log) => new Date(log.recordedAt).getTime()).filter((t) => !Number.isNaN(t))
  return times.length ? new Date(Math.min(...times)) : null
}

export function calculateProfileStats({
  logs,
  spentPerItem,
  trackingStartedAt,
  now,
}: ProfileStatsInput): ProfileStats {
  const mileages = logs.map((log) => log.mileage)

  // The car's createdAt is the honest start, but a car created before this stat
  // existed can still carry an older reading — take whichever came first.
  const carStart = trackingStartedAt ? new Date(trackingStartedAt) : null
  const logStart = earliest(logs)
  const candidates = [carStart, logStart].filter((d): d is Date => d !== null && !Number.isNaN(d.getTime()))
  const start = candidates.length ? new Date(Math.min(...candidates.map((d) => d.getTime()))) : null

  // A start in the future — a clock skew, or a date typed ahead — must not read
  // as negative days or as a countdown, so it collapses to "started just now".
  const trackedSince = start ? new Date(Math.min(start.getTime(), now.getTime())) : null

  return {
    trackedKm: mileages.length ? Math.max(...mileages) - Math.min(...mileages) : null,
    readingsCount: logs.length,
    totalSpent: spentPerItem.reduce((sum, spent) => sum + spent, 0),
    trackedDays: trackedSince ? differenceInCalendarDays(now, trackedSince) : null,
    trackedSince,
  }
}
