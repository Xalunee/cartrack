import { apiClient } from '@shared/api/client'
import { User, UpdateUserDto } from '../model/types'

export const userApi = {
  get: () => apiClient<User>('/api/user'),
  update: (data: UpdateUserDto) =>
    apiClient<User>('/api/user', { method: 'PATCH', body: JSON.stringify(data) }),
}
