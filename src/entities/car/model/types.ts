export interface Car {
  id: string
  userId: string
  brand: string
  model: string
  year: number
  licensePlate: string | null
  stsNumber: string | null
  currentMileage: number
  lastTrackedAt: Date
  lastFinesCheckAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCarDto {
  brand: string
  model: string
  year: number
  licensePlate?: string
  currentMileage: number
}

export interface UpdateCarDto extends Partial<CreateCarDto> {
  stsNumber?: string
}
