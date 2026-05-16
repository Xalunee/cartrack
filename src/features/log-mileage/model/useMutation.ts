import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mileageApi, mileageKeys } from '@entities/mileage-log'

export function useLogMileageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mileageApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: mileageKeys.all }),
  })
}
