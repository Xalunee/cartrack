import type { MaintenanceStatus } from '@shared/config'

export interface MaintenanceItem {
  id: string
  carId: string
  name: string
  intervalKm?: number
  intervalDays?: number
  lastDoneKm?: number
  lastDoneAt?: string
  nextDueKm?: number
  nextDueAt?: string
  status: MaintenanceStatus
  createdAt: string
  updatedAt: string
}
