import { apiClient } from '@shared/api/client'
import { MaintenanceItemWithStatus, CreateMaintenanceItemDto, UpdateMaintenanceItemDto } from '../model/types'

export const maintenanceApi = {
  getAll: () => apiClient<MaintenanceItemWithStatus[]>('/api/maintenance'),
  getOne: (id: string) => apiClient<MaintenanceItemWithStatus>(`/api/maintenance/${id}`),
  create: (data: CreateMaintenanceItemDto) =>
    apiClient<MaintenanceItemWithStatus>('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateMaintenanceItemDto) =>
    apiClient<MaintenanceItemWithStatus>(`/api/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ success: true }>(`/api/maintenance/${id}`, { method: 'DELETE' }),
}
