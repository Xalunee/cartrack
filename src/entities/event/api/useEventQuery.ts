import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/api/client'
import type { CarEvent } from '../model/types'

export const EVENT_QUERY_KEY = ['events'] as const

export function useEventsQuery() {
  return useQuery({
    queryKey: EVENT_QUERY_KEY,
    queryFn: () => apiClient<CarEvent[]>('/api/events'),
  })
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ success: true }>(`/api/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEY })
    },
  })
}
