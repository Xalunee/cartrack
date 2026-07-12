export interface ServiceRecord {
  id: string
  maintenanceItemId: string
  mileage: number
  date: Date
  cost: number | null
  notes: string | null
  createdAt: Date
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
