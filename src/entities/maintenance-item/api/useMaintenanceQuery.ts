import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceApi } from './maintenanceApi'
import { CreateMaintenanceItemDto, UpdateMaintenanceItemDto } from '../model/types'

export const MAINTENANCE_QUERY_KEY = ['maintenance'] as const

export function useMaintenanceQuery() {
  return useQuery({
    queryKey: MAINTENANCE_QUERY_KEY,
    queryFn: maintenanceApi.getAll,
  })
}

export function useCreateMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMaintenanceItemDto) => maintenanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
    },
  })
}

export function useUpdateMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceItemDto }) =>
      maintenanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
    },
  })
}

export function useDeleteMaintenanceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => maintenanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
    },
  })
}
