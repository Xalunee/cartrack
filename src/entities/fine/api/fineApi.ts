import { apiClient } from '@shared/api/client'
import { Fine, FinesResponse, CheckFinesResult } from '../model/types'

export const fineApi = {
  getAll: () => apiClient<FinesResponse>('/api/fines'),
  check: () => apiClient<CheckFinesResult>('/api/fines/check', { method: 'POST' }),
  togglePaid: (id: string, isPaid: boolean) =>
    apiClient<Fine>(`/api/fines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPaid }),
    }),
}
