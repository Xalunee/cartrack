import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventApi, eventKeys } from '@entities/event'

export function useAddEventMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  })
}
