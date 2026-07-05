import { MaintenanceStatus, RemainingResource, DrivingPace } from '@shared/types'

interface MaintenanceItemData {
  intervalKm: number | null
  intervalDays: number | null
  lastServiceMileage: number | null
  lastServiceDate: Date | null
}

/**
 * Determine status based on used percent.
 * ok: < 70% used | soon: 70–90% used | critical: > 90% used or overdue
 */
function getStatus(usedPercent: number): MaintenanceStatus {
  if (usedPercent >= 90) return 'critical'
  if (usedPercent >= 70) return 'soon'
  return 'ok'
}

/**
 * Calculate remaining resource for a maintenance item.
 * Both km and days intervals are evaluated — worst one wins.
 */
export function calculateRemainingResource(
  item: MaintenanceItemData,
  currentMileage: number,
  pace: DrivingPace | null
): RemainingResource {
  let remainingKm: number | null = null
  let remainingDays: number | null = null
  let usedPercentKm = 0
  let usedPercentDays = 0
  let forecastDate: Date | null = null

  // --- KM-based ---
  if (item.intervalKm && item.lastServiceMileage !== null) {
    const usedKm = currentMileage - item.lastServiceMileage
    remainingKm = item.intervalKm - usedKm
    usedPercentKm = Math.min(100, (usedKm / item.intervalKm) * 100)

    if (pace && remainingKm > 0) {
      const daysUntil = remainingKm / pace.kmPerDay
      forecastDate = new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000)
    }
  }

  // --- Days-based ---
  if (item.intervalDays && item.lastServiceDate) {
    const lastDate = new Date(item.lastServiceDate)
    const nextDate = new Date(lastDate.getTime() + item.intervalDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    const msRemaining = nextDate.getTime() - now.getTime()
    remainingDays = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
    const usedDays = item.intervalDays - remainingDays
    usedPercentDays = Math.min(100, (usedDays / item.intervalDays) * 100)

    // Forecast: use whichever future date comes first; overdue dates aren't a forecast
    if (nextDate > now && (!forecastDate || nextDate < forecastDate)) {
      forecastDate = nextDate
    }
  }

  // Worst percent wins
  const usedPercent = Math.max(usedPercentKm, usedPercentDays)

  return {
    remainingKm,
    remainingDays,
    usedPercent: Math.round(usedPercent),
    status: getStatus(usedPercent),
    forecastDate,
  }
}
