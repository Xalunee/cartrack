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

/** Почему отрезок между заправками не дал числа — или дал, но подозрительное. */
export type FuelSegmentStatus =
  | 'ok'
  | 'outlier' // резко отличается от собственной истории машины
  | 'missing-mileage' // на одном из концов не записан одометр
  | 'missed-entry' // внутри отрезка есть незаписанная заправка
  | 'no-distance' // одометр не вырос (или ушёл назад) — делить не на что

/** Промежуток между двумя подряд идущими заправками «до полного». */
export interface FuelSegment {
  fromEntryId: string
  toEntryId: string
  fromDate: Date
  toDate: Date
  distanceKm: number | null
  /** Литры, залитые после открывающей заправки и по закрывающую включительно. */
  liters: number
  /** Л/100 км. null, когда отрезок непосчитуем. */
  consumption: number | null
  status: FuelSegmentStatus
}

export interface FuelConsumptionStats {
  /** Все отрезки, включая непосчитуемые — чтобы UI мог объяснить пропуск. */
  segments: FuelSegment[]
  /** Л/100 км по отрезкам со статусом 'ok'. null, если считать не из чего. */
  averageConsumption: number | null
  basedOnSegments: number
}
