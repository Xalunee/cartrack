import { apiClient } from '@shared/api/client'
import type { Car } from '../model/types'

export const carApi = {
  get: () => apiClient<Car>('/api/car'),
  update: (body: Partial<Car>) => apiClient<Car>('/api/car', { method: 'PUT', body: JSON.stringify(body) }),
}
