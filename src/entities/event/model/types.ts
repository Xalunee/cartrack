export type EventType = 'ACCIDENT' | 'MALFUNCTION' | 'FINE' | 'SERVICE' | 'NOTE'

export interface CarEvent {
  id: string
  carId: string
  type: EventType
  title: string
  description: string | null
  cost: number | null
  occurredAt: string
  createdAt: string
}
