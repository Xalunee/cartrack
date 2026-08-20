export interface ServiceRecord {
  id: string
  maintenanceItemId: string
  mileage: number
  date: Date
  cost: number | null
  notes: string | null
  createdAt: Date
}

export interface ServiceRecordWithItem extends ServiceRecord {
  itemName: string
}

export interface CompleteServiceDto {
  mileage: number
  date: string
  cost?: number
  notes?: string
}

export interface UpdateServiceRecordDto {
  mileage?: number
  date?: string
  cost?: number
  notes?: string
}

/** What deleting a record would do to the paired mileage point. */
export interface ServiceRecordPair {
  found: boolean
  /** Several candidate logs matched and the date could not separate them. */
  ambiguous: boolean
  log?: { id: string; mileage: number; recordedAt: string }
  currentMileage: number
  mileageAfterDelete: number
  /** True when the paired point is the newest reading the odometer sits on. */
  lowersCurrentMileage: boolean
}

export interface DeleteServiceRecordResult {
  success: true
  pair: 'none' | 'ambiguous' | 'kept' | 'deleted'
  currentMileage: number
  currentMileageChanged: boolean
}
