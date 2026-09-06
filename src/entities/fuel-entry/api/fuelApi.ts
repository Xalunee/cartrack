import { apiClient } from '@shared/api/client'
import type {
  CreateFuelEntryDto,
  DeleteFuelEntryResult,
  FuelEntry,
  FuelEntryPair,
  FuelListResponse,
  UpdateFuelEntryDto,
} from '../model/types'

/** Both writes report whether the paired mileage point could be kept in step. */
type WithMileageWarning<T> = T & { mileageLogWarning: string | null }

export const fuelApi = {
  getAll: () => apiClient<FuelListResponse>('/api/fuel'),
  get: (id: string) => apiClient<FuelEntry>(`/api/fuel/${id}`),
  create: (data: CreateFuelEntryDto) =>
    apiClient<WithMileageWarning<FuelEntry>>('/api/fuel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateFuelEntryDto) =>
    apiClient<WithMileageWarning<FuelEntry>>(`/api/fuel/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  /** Whether a mileage point is paired with this entry, and what removing it costs. */
  pair: (id: string) => apiClient<FuelEntryPair>(`/api/fuel/${id}/pair`),
  delete: (id: string, deleteMileageLog = false) =>
    apiClient<DeleteFuelEntryResult>(
      `/api/fuel/${id}${deleteMileageLog ? '?deleteMileageLog=true' : ''}`,
      { method: 'DELETE' }
    ),
}
