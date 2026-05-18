export type ApiResponse<T> = { data: T } | { error: string }

export type MaintenanceStatus = 'ok' | 'soon' | 'critical'

export interface RemainingResource {
  remainingKm: number | null
  remainingDays: number | null
  usedPercent: number // 0–100
  status: MaintenanceStatus
  forecastDate: Date | null // predicted next service date
}

export interface DrivingPace {
  kmPerDay: number
  kmPerWeek: number
  basedOnLogs: number // how many logs were used
}
