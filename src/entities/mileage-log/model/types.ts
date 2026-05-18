import { DrivingPace } from '@shared/types'

export interface MileageLog {
  id: string
  carId: string
  mileage: number
  recordedAt: Date
  note: string | null
}

export interface MileageLogsResponse {
  logs: MileageLog[]
  pace: DrivingPace | null
}

export interface CreateMileageLogDto {
  mileage: number
  note?: string
}
