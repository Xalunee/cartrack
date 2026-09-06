import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isClientError } from '@shared/api/client'
import { CAR_QUERY_KEY } from '@entities/car'
import { MILEAGE_QUERY_KEY } from '@entities/mileage-log'
import { fuelApi } from './fuelApi'
import type { CreateFuelEntryDto, UpdateFuelEntryDto } from '../model/types'

export const FUEL_QUERY_KEY = ['fuel'] as const

export function fuelEntryQueryKey(id: string) {
  return ['fuel', id] as const
}

export function useFuelEntriesQuery() {
  return useQuery({
    queryKey: FUEL_QUERY_KEY,
    queryFn: fuelApi.getAll,
    // A user with no car yet gets a 404, and no number of retries will conjure
    // one — same rule the mileage and car queries follow.
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
  })
}

export function useFuelEntryQuery(id: string) {
  return useQuery({
    queryKey: fuelEntryQueryKey(id),
    queryFn: () => fuelApi.get(id),
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
  })
}

/**
 * Every fuel write can move the car's odometer through a paired MileageLog, and
 * adding or removing any entry changes which segments are computable — so the
 * whole list, not just the row, has to be refetched. The three keys go together
 * on every mutation for the same reason the service-record mutations drop them.
 */
function invalidateFuel(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEY })
  queryClient.invalidateQueries({ queryKey: CAR_QUERY_KEY })
  queryClient.invalidateQueries({ queryKey: MILEAGE_QUERY_KEY })
}

export function useCreateFuelEntryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFuelEntryDto) => fuelApi.create(data),
    onSuccess: () => invalidateFuel(queryClient),
  })
}

export function useUpdateFuelEntryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFuelEntryDto }) =>
      fuelApi.update(id, data),
    onSuccess: () => invalidateFuel(queryClient),
  })
}

/**
 * Only fetched while a delete confirmation is open — the answer depends on the
 * mileage history, which the entry list does not carry.
 */
export function useFuelEntryPairQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['fuel', id, 'pair'],
    queryFn: () => fuelApi.pair(id),
    enabled,
    staleTime: 0,
  })
}

export function useDeleteFuelEntryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, deleteMileageLog }: { id: string; deleteMileageLog: boolean }) =>
      fuelApi.delete(id, deleteMileageLog),
    onSuccess: () => invalidateFuel(queryClient),
  })
}
