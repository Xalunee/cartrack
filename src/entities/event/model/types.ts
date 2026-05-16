export type EventType = 'service' | 'refuel' | 'repair' | 'inspection' | 'other'

export interface CarEvent {
  id: string
  carId: string
  type: EventType
  title: string
  description?: string
  cost?: number
  occurredAt: string
  createdAt: string
}
