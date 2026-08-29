import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supportApi } from './supportApi'
import { CreateSupportTicketDto } from '../model/types'

export const SUPPORT_QUERY_KEY = ['support-tickets'] as const

export function useSupportTicketsQuery() {
  return useQuery({
    queryKey: SUPPORT_QUERY_KEY,
    queryFn: supportApi.getAll,
  })
}

export function useCreateSupportTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSupportTicketDto) => supportApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEY })
    },
  })
}
