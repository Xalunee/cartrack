import { MAINTENANCE_STATUS, type MaintenanceStatus } from '@shared/config'
import type { MaintenanceItem } from './types'

export function computeStatus(item: MaintenanceItem, currentKm: number): MaintenanceStatus {
  if (!item.intervalKm || item.lastServiceMileage === null) return MAINTENANCE_STATUS.OK
  const nextDueKm = item.lastServiceMileage + item.intervalKm
  const remaining = nextDueKm - currentKm
  if (remaining <= 0) return MAINTENANCE_STATUS.CRITICAL
  if (remaining <= item.intervalKm * 0.1) return MAINTENANCE_STATUS.SOON
  return MAINTENANCE_STATUS.OK
}
