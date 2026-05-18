import { DrivingPace } from '@shared/types'

interface MileageLogEntry {
  mileage: number
  recordedAt: Date
}

/**
 * Calculate average driving pace from mileage logs.
 * Uses the last 8 logs max for relevance.
 * Returns null if not enough data (< 2 logs).
 */
export function calculateDrivingPace(
  logs: MileageLogEntry[]
): DrivingPace | null {
  if (logs.length < 2) return null

  const sorted = [...logs]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-8)

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const diffMs = new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 1) return null

  const diffKm = last.mileage - first.mileage
  const kmPerDay = diffKm / diffDays

  return {
    kmPerDay,
    kmPerWeek: kmPerDay * 7,
    basedOnLogs: sorted.length,
  }
}
