import { apiClient } from '@shared/api/client'
import type { CarEvent } from '../model/types'

export const eventApi = {
  list: () => apiClient<CarEvent[]>('/api/events'),
  create: (body: Omit<CarEvent, 'id' | 'createdAt'>) =>
    apiClient<CarEvent>('/api/events', { method: 'POST', body: JSON.stringify(body) }),
}
