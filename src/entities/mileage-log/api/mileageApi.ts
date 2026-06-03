import { apiClient } from '@shared/api/client'
import { MileageLogsResponse, CreateMileageLogDto, UpdateMileageLogDto } from '../model/types'

export const mileageApi = {
  getAll: () => apiClient<MileageLogsResponse>('/api/mileage'),
  create: (data: CreateMileageLogDto) =>
    apiClient<MileageLogsResponse>('/api/mileage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateMileageLogDto) =>
    apiClient<{ success: true }>(`/api/mileage/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ success: true }>(`/api/mileage/${id}`, { method: 'DELETE' }),
}
