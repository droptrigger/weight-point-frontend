import type { Landfill } from '@/features/landfills/api'
import { http, type ListParams, type Paged } from '@/shared/api/http'

type Named = { firstName: string; lastName: string | null; email: string }

export type User = Named & { id: string; role: string; isActive: boolean }

export type UserDetails = Named & {
  id: string
  role: { id: number; name: string }
  landfill: Landfill | null
  createdAt: string
  isActive: boolean
}

// landfillId учитывает только разработчик: остальные работают с пользователями своего полигона
export type UserInput = { firstName: string; lastName: string | null; landfillId?: string }
export type UserParams = ListParams & { landfillId?: string; roleId?: string }
export type PromoteTarget = 'admin' | 'accountant' | 'employee'

export const usersApi = {
  list: (p: UserParams) => http.get<Paged<User>>('/users', p),
  get: (id: string) => http.get<UserDetails>(`/users/${id}`),
  create: (d: UserInput & { email: string; password: string }) =>
    http.post<UserDetails>('/users', d),
  update: (id: string, d: UserInput) => http.put<UserDetails>(`/users/${id}`, { id, ...d }),
  remove: (id: string) => http.delete(`/users/${id}`),
  restore: (id: string) => http.patch(`/users/${id}/restore`),
  promote: (id: string, to: PromoteTarget) =>
    http.patch<UserDetails>(`/users/${id}/promote-to-${to}`),
}

export const fullName = (u: Named) => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email

export function initials(u: Named) {
  const first = u.firstName.trim()
  const last = (u.lastName ?? '').trim()
  return (first && last ? first[0] + last[0] : (first || last || u.email).slice(0, 2)).toUpperCase()
}
