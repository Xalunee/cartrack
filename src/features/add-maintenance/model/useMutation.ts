import { useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceApi, maintenanceKeys } from '@entities/maintenance-item'

export function useAddMaintenanceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.all }),
  })
}
