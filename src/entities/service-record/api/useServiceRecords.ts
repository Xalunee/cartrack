import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MAINTENANCE_QUERY_KEY } from '@entities/maintenance-item'
import { CAR_QUERY_KEY } from '@entities/car'
import { serviceRecordApi } from './serviceRecordApi'
import { CompleteServiceDto, UpdateServiceRecordDto } from '../model/types'

export const ALL_SERVICE_RECORDS_QUERY_KEY = ['service-records', 'all'] as const

export function serviceRecordsQueryKey(itemId: string) {
  return ['service-records', itemId] as const
}

export function useAllServiceRecordsQuery() {
  return useQuery({
    queryKey: ALL_SERVICE_RECORDS_QUERY_KEY,
    queryFn: serviceRecordApi.getAll,
  })
}

export function useServiceRecordsQuery(itemId: string) {
  return useQuery({
    queryKey: serviceRecordsQueryKey(itemId),
    queryFn: () => serviceRecordApi.getForItem(itemId),
  })
}

export function useCompleteServiceMutation(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CompleteServiceDto) => serviceRecordApi.complete(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: serviceRecordsQueryKey(itemId) })
      queryClient.invalidateQueries({ queryKey: ALL_SERVICE_RECORDS_QUERY_KEY })
    },
  })
}

export function useUpdateServiceRecordMutation(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRecordDto }) =>
      serviceRecordApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: serviceRecordsQueryKey(itemId) })
      queryClient.invalidateQueries({ queryKey: ALL_SERVICE_RECORDS_QUERY_KEY })
    },
  })
}

export function useDeleteServiceRecordMutation(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => serviceRecordApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: serviceRecordsQueryKey(itemId) })
      queryClient.invalidateQueries({ queryKey: ALL_SERVICE_RECORDS_QUERY_KEY })
    },
  })
}
