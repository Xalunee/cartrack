import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isClientError } from '@shared/api/client'
import { mileageApi } from './mileageApi'
import { CreateMileageLogDto, UpdateMileageLogDto } from '../model/types'
import { MAINTENANCE_QUERY_KEY } from '@entities/maintenance-item'
import { CAR_QUERY_KEY } from '@entities/car'

export const MILEAGE_QUERY_KEY = ['mileage'] as const

export function useMileageQuery() {
  return useQuery({
    queryKey: MILEAGE_QUERY_KEY,
    queryFn: mileageApi.getAll,
    // Both dashboard widgets now mount before the car is known, so a user
    // without one reaches this route and gets a 404. Retrying it only doubles
    // the requests behind an answer that will not change.
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
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

export function useUpdateMileageLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMileageLogDto }) =>
      mileageApi.update(id, data),
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
    mutationFn: (id: string) => mileageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
    },
  })
}
