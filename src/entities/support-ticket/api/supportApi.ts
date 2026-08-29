import { apiClient } from '@shared/api/client'
import { CreateSupportTicketDto, SupportTicket } from '../model/types'

export const supportApi = {
  getAll: () => apiClient<SupportTicket[]>('/api/support'),
  create: (data: CreateSupportTicketDto) =>
    apiClient<{ id: string; createdAt: string }>('/api/support', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
