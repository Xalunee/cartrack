import { apiClient } from '@shared/api/client'
import type { MaintenanceItemWithStatus } from '@entities/maintenance-item'
import {
  ServiceRecord,
  ServiceRecordWithItem,
  CompleteServiceDto,
  UpdateServiceRecordDto,
  ServiceRecordPair,
  DeleteServiceRecordResult,
} from '../model/types'

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
  // Widened like `complete`: the route reports when it could not sync the paired
  // mileage point, and a warning the type hides is a warning nobody shows.
  update: (id: string, data: UpdateServiceRecordDto) =>
    apiClient<ServiceRecord & { mileageLogWarning: string | null }>(
      `/api/service-records/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),
  /** Whether a mileage point is paired with this record, and what removing it costs. */
  pair: (id: string) => apiClient<ServiceRecordPair>(`/api/service-records/${id}/pair`),
  // The flag goes in the query string: DELETE request bodies are not carried
  // reliably by every proxy and runtime, and this is one boolean.
  delete: (id: string, deleteMileageLog = false) =>
    apiClient<DeleteServiceRecordResult>(
      `/api/service-records/${id}${deleteMileageLog ? '?deleteMileageLog=true' : ''}`,
      { method: 'DELETE' }
    ),
}
