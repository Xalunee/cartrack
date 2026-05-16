import { apiClient } from '@shared/api/client'
import type { MaintenanceItem } from '../model/types'

export const maintenanceApi = {
  list: () => apiClient<MaintenanceItem[]>('/api/maintenance'),
  get: (id: string) => apiClient<MaintenanceItem>(`/api/maintenance/${id}`),
  create: (body: Omit<MaintenanceItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>) =>
    apiClient<MaintenanceItem>('/api/maintenance', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<MaintenanceItem>) =>
    apiClient<MaintenanceItem>(`/api/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) =>
    apiClient<{ success: boolean }>(`/api/maintenance/${id}`, { method: 'DELETE' }),
}
