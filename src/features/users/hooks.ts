import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/hooks'
import { landfillKeys } from '@/features/landfills/hooks'
import { usersApi, type PromoteTarget, type UserInput, type UserParams } from './api'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (p: UserParams) => [...userKeys.lists(), p] as const,
  one: (id: string) => [...userKeys.all, 'one', id] as const,
}

export const useUsers = (p: UserParams) =>
  useQuery({
    queryKey: userKeys.list(p),
    queryFn: () => usersApi.list(p),
    placeholderData: keepPreviousData,
  })

export const useUser = (id: string) =>
  useQuery({ queryKey: userKeys.one(id), queryFn: () => usersApi.get(id) })

// Сотрудники видны и в карточках полигонов, а изменённым может оказаться текущий пользователь
// в шапке, поэтому сбрасываются все три кеша
function useUserMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: userKeys.all }),
        qc.invalidateQueries({ queryKey: landfillKeys.details() }),
        qc.invalidateQueries({ queryKey: authKeys.all }),
      ]),
  })
}

export type SaveUserArgs =
  { id: string; data: UserInput } | { data: UserInput; email: string; password: string }

export const useSaveUser = () =>
  useUserMutation((v: SaveUserArgs) =>
    'email' in v
      ? usersApi.create({ ...v.data, email: v.email, password: v.password })
      : usersApi.update(v.id, v.data),
  )

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersApi.remove,
    // Карточка удалённого пользователя не перезапрашивается: со страницы происходит переход
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  })
}

export const useRestoreUser = () => useUserMutation(usersApi.restore)

export const usePromoteUser = () =>
  useUserMutation((v: { id: string; to: PromoteTarget }) => usersApi.promote(v.id, v.to))
