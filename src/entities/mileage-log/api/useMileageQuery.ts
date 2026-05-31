import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@shared/api/client'
import { mileageApi } from './mileageApi'
import { CreateMileageLogDto } from '../model/types'
import { MAINTENANCE_QUERY_KEY } from '@entities/maintenance-item'
import { CAR_QUERY_KEY } from '@entities/car'

export const MILEAGE_QUERY_KEY = ['mileage'] as const

export function useMileageQuery() {
  return useQuery({
    queryKey: MILEAGE_QUERY_KEY,
    queryFn: mileageApi.getAll,
  })
}

export function useLogMileageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMileageLogDto) => mileageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
    },
  })
}

export function useDeleteMileageLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ success: true }>(`/api/mileage/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
    },
  })
}
