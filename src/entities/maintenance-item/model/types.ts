import { RemainingResource } from '@shared/types'

export interface MaintenanceItem {
  id: string
  carId: string
  name: string
  intervalKm: number | null
  intervalDays: number | null
  lastServiceMileage: number | null
  lastServiceDate: Date | null
  lastServiceCost: number | null
  lastServiceNotes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceItemWithStatus extends MaintenanceItem {
  resource: RemainingResource
}

export interface CreateMaintenanceItemDto {
  name: string
  intervalKm?: number
  intervalDays?: number
  lastServiceMileage?: number
  lastServiceDate?: string
  lastServiceCost?: number
  lastServiceNotes?: string
}

export interface UpdateMaintenanceItemDto extends Partial<CreateMaintenanceItemDto> {}
