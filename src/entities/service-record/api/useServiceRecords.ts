import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MAINTENANCE_QUERY_KEY } from '@entities/maintenance-item'
import { CAR_QUERY_KEY } from '@entities/car'
import { MILEAGE_QUERY_KEY } from '@entities/mileage-log'
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
      queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
    },
  })
}

export function useUpdateServiceRecordMutation(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRecordDto }) =>
      serviceRecordApi.update(id, data),
    // Editing a record also rewrites its paired MileageLog and recomputes the
    // car's odometer, so the same keys the complete mutation drops must go too —
    // otherwise the dashboard header keeps the pre-edit mileage until a reload.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: serviceRecordsQueryKey(itemId) })
      queryClient.invalidateQueries({ queryKey: ALL_SERVICE_RECORDS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
    },
  })
}

/**
 * Only fetched while a delete confirmation is open — the answer depends on the
 * mileage history, which the record lists do not carry.
 */
export function useServiceRecordPairQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['service-records', id, 'pair'],
    queryFn: () => serviceRecordApi.pair(id),
    enabled,
    staleTime: 0,
  })
}

export function useDeleteServiceRecordMutation(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, deleteMileageLog }: { id: string; deleteMileageLog: boolean }) =>
      serviceRecordApi.delete(id, deleteMileageLog),
    // Deletion re-points the item's lastService* reference, which every
    // maintenance figure is measured from, and always touches the paired mileage
    // point — dropping it, or clearing its note — so the car and mileage keys
    // have to go with it.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: serviceRecordsQueryKey(itemId) })
      queryClient.invalidateQueries({ queryKey: ALL_SERVICE_RECORDS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
    },
  })
}
