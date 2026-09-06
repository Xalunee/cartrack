import type { FuelSegment } from '@shared/types'

export interface FuelEntry {
  id: string
  carId: string
  /** Одометр на момент заправки; null — если на него не посмотрели. */
  mileage: number | null
  date: string
  liters: number
  totalCost: number
  isFullTank: boolean
  hasMissedEntry: boolean
  station: string | null
  fuelType: string | null
  receiptPhotoUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Запись вместе с отрезком расхода, который она закрывает (если закрывает). */
export interface FuelEntryWithSegment extends FuelEntry {
  segment: FuelSegment | null
}

export interface FuelListResponse {
  entries: FuelEntryWithSegment[]
  averageConsumption: number | null
  basedOnSegments: number
  /** Заправки из прошлых записей этого пользователя — подсказки для формы. */
  stations: string[]
}

export interface CreateFuelEntryDto {
  liters: number
  totalCost: number
  date: string
  mileage?: number
  isFullTank: boolean
  hasMissedEntry: boolean
  station?: string
  fuelType?: string
  notes?: string
}

/**
 * `null` у mileage — это значение, а не пропуск: «одометр я всё-таки не
 * записал». Пропущенное поле означает «не трогал», и с парной точкой пробега
 * эти два случая делают противоположное.
 */
export interface UpdateFuelEntryDto {
  liters?: number
  totalCost?: number
  date?: string
  mileage?: number | null
  isFullTank?: boolean
  hasMissedEntry?: boolean
  station?: string | null
  fuelType?: string | null
  notes?: string | null
}

/** Что удаление записи сделает с парной точкой пробега. */
export interface FuelEntryPair {
  found: boolean
  ambiguous: boolean
  log?: { id: string; mileage: number; recordedAt: string }
  currentMileage: number
  mileageAfterDelete: number
  lowersCurrentMileage: boolean
}

export interface DeleteFuelEntryResult {
  success: true
  pair: 'none' | 'ambiguous' | 'kept' | 'deleted'
  currentMileage: number
  currentMileageChanged: boolean
}

/** Цена за литр не хранится — это единственное место, где она считается. */
export function pricePerLiter(entry: Pick<FuelEntry, 'liters' | 'totalCost'>): number | null {
  return entry.liters > 0 ? entry.totalCost / entry.liters : null
}
