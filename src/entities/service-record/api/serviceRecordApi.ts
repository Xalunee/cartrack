import { apiClient } from '@shared/api/client'
import type { MaintenanceItemWithStatus } from '@entities/maintenance-item'
import { ServiceRecord, ServiceRecordWithItem, CompleteServiceDto, UpdateServiceRecordDto } from '../model/types'

export const serviceRecordApi = {
  getAll: () => apiClient<ServiceRecordWithItem[]>('/api/service-records'),
  getForItem: (itemId: string) =>
    apiClient<ServiceRecord[]>(`/api/maintenance/${itemId}/records`),
  complete: (itemId: string, data: CompleteServiceDto) =>
    apiClient<MaintenanceItemWithStatus & { mileageLogWarning: string | null }>(
      `/api/maintenance/${itemId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  update: (id: string, data: UpdateServiceRecordDto) =>
    apiClient<ServiceRecord>(`/api/service-records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ success: true }>(`/api/service-records/${id}`, { method: 'DELETE' }),
}
