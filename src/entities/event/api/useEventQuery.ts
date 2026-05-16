import { useQuery } from '@tanstack/react-query'
import { eventApi } from './eventApi'

export const eventKeys = {
  all: ['events'] as const,
}

export function useEventQuery() {
  return useQuery({ queryKey: eventKeys.all, queryFn: eventApi.list })
}
