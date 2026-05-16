import { useQuery } from '@tanstack/react-query'
import { carApi } from './carApi'

export const carKeys = {
  all: ['car'] as const,
}

export function useCarQuery() {
  return useQuery({ queryKey: carKeys.all, queryFn: carApi.get })
}
