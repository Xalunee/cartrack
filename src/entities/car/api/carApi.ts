import { apiClient } from '@shared/api/client'
import { Car, CreateCarDto, UpdateCarDto } from '../model/types'

export const carApi = {
  get: () => apiClient<Car>('/api/car'),
  create: (data: CreateCarDto) =>
    apiClient<Car>('/api/car', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: UpdateCarDto) =>
    apiClient<Car>('/api/car', { method: 'PATCH', body: JSON.stringify(data) }),
}
