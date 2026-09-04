import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isClientError } from '@shared/api/client'
import { carApi } from './carApi'
import { UpdateCarDto } from '../model/types'

export const CAR_QUERY_KEY = ['car'] as const

export function useCarQuery() {
  return useQuery({
    queryKey: CAR_QUERY_KEY,
    queryFn: carApi.get,
    // A user with no car yet gets a 404, and no number of retries will
    // conjure one — they should see the "add a car" card at once.
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 2),
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
