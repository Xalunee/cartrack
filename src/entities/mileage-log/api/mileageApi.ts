import { apiClient } from '@shared/api/client'
import type { MileageLog } from '../model/types'

export const mileageApi = {
  list: () => apiClient<MileageLog[]>('/api/mileage'),
  create: (body: Omit<MileageLog, 'id'>) =>
    apiClient<MileageLog>('/api/mileage', { method: 'POST', body: JSON.stringify(body) }),
}
