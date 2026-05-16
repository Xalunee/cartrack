import { useMutation, useQueryClient } from '@tanstack/react-query'
import { carApi, carKeys } from '@entities/car'

export function useUpdateCarMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: carApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: carKeys.all }),
  })
}
