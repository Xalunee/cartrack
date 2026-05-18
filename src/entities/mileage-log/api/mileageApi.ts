import { apiClient } from '@shared/api/client'
import { MileageLogsResponse, CreateMileageLogDto } from '../model/types'

export const mileageApi = {
  getAll: () => apiClient<MileageLogsResponse>('/api/mileage'),
  create: (data: CreateMileageLogDto) =>
    apiClient<MileageLogsResponse>('/api/mileage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
