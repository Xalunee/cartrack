import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from './userApi'
import { UpdateUserDto } from '../model/types'

export const USER_QUERY_KEY = ['user'] as const

export function useUserQuery() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: userApi.get,
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateUserDto) => userApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY })
    },
  })
}
