import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { carApi } from './carApi'
import { UpdateCarDto } from '../model/types'

export const CAR_QUERY_KEY = ['car'] as const

export function useCarQuery() {
  return useQuery({
    queryKey: CAR_QUERY_KEY,
    queryFn: carApi.get,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('404')) return false
      return failureCount < 2
    },
  })
}

export function useUpdateCarMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateCarDto) => carApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
    },
  })
}
