import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
