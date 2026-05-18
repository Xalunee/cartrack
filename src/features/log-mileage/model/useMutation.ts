import { mileageApi, MILEAGE_QUERY_KEY } from '@entities/mileage-log'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MAINTENANCE_QUERY_KEY } from '@entities/maintenance-item'
import { CAR_QUERY_KEY } from '@entities/car'

export function useLogMileageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mileageApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
      qc.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      qc.invalidateQueries({ queryKey: CAR_QUERY_KEY })
    },
  })
}
