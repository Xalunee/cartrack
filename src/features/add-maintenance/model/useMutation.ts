import { useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceApi, MAINTENANCE_QUERY_KEY } from '@entities/maintenance-item'

export function useAddMaintenanceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY }),
  })
}
