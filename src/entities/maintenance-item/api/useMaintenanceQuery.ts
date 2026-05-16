import { useQuery } from '@tanstack/react-query'
import { maintenanceApi } from './maintenanceApi'

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  detail: (id: string) => ['maintenance', id] as const,
}

export function useMaintenanceQuery() {
  return useQuery({ queryKey: maintenanceKeys.all, queryFn: maintenanceApi.list })
}

export function useMaintenanceDetailQuery(id: string) {
  return useQuery({ queryKey: maintenanceKeys.detail(id), queryFn: () => maintenanceApi.get(id) })
}
