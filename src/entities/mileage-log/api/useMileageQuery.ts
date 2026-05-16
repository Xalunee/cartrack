import { useQuery } from '@tanstack/react-query'
import { mileageApi } from './mileageApi'

export const mileageKeys = {
  all: ['mileage'] as const,
}

export function useMileageQuery() {
  return useQuery({ queryKey: mileageKeys.all, queryFn: mileageApi.list })
}
