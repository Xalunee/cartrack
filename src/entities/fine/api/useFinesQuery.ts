import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fineApi } from './fineApi'

export const FINES_QUERY_KEY = ['fines'] as const

export function useFinesQuery() {
  return useQuery({
    queryKey: FINES_QUERY_KEY,
    queryFn: fineApi.getAll,
  })
}

export function useCheckFinesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fineApi.check,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINES_QUERY_KEY })
    },
  })
}

export function useToggleFinePaidMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      fineApi.togglePaid(id, isPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINES_QUERY_KEY })
    },
  })
}
