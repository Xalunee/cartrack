import { DrivingPace } from '@shared/types'

interface MileageLogEntry {
  mileage: number
  recordedAt: Date
}

/**
 * How many of the most recent readings a pace is derived from. Every caller
 * fetching logs for a pace must use this as its `take`, or it hands the
 * calculation a different window than the one it is written for.
 */
export const MILEAGE_LOGS_FOR_PACE = 8

/**
 * Calculate average driving pace from mileage logs.
 * Uses the most recent MILEAGE_LOGS_FOR_PACE readings for relevance.
 * Returns null if not enough data (< 2 logs).
 */
export function calculateDrivingPace(
  logs: MileageLogEntry[]
): DrivingPace | null {
  if (logs.length < 2) return null

  const sorted = [...logs]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-MILEAGE_LOGS_FOR_PACE)

  // Odometers never run backwards — drop any point whose mileage is lower than
  // the running max of earlier-dated points, so a single backdated/out-of-order
  // entry can't corrupt the slope.
  const clean: MileageLogEntry[] = []
  let runningMax = -Infinity
  for (const point of sorted) {
    if (point.mileage >= runningMax) {
      clean.push(point)
      runningMax = point.mileage
    }
  }

  if (clean.length < 2) return null

  const firstMs = new Date(clean[0].recordedAt).getTime()
  const lastMs = new Date(clean[clean.length - 1].recordedAt).getTime()
  const diffDays = (lastMs - firstMs) / (1000 * 60 * 60 * 24)

  if (diffDays < 1) return null

  // Least-squares linear regression of mileage over time (x = days since first
  // point) so one odd point among several can't swing the estimate the way a
  // pure first/last comparison would.
  const xs = clean.map((p) => (new Date(p.recordedAt).getTime() - firstMs) / (1000 * 60 * 60 * 24))
  const ys = clean.map((p) => p.mileage)
  const n = clean.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }

  const kmPerDay = den === 0 ? 0 : num / den

  if (kmPerDay < 0) return null

  return {
    kmPerDay,
    kmPerWeek: kmPerDay * 7,
    basedOnLogs: clean.length,
  }
}
