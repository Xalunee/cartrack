import { useMutation, useQueryClient } from '@tanstack/react-query'
import { carApi, CAR_QUERY_KEY } from '@entities/car'

export function useUpdateCarMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: carApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: CAR_QUERY_KEY }),
  })
}
