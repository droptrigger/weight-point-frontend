import { useMemo } from 'react'
import { useAccessToken } from '@/shared/api/session'

export const ROLES = ['employee', 'accountant', 'admin', 'developer'] as const
export type Role = (typeof ROLES)[number]

export type Permission =
  | 'reference.edit' // создание, правка и удаление записей справочников своего полигона
  | 'users.view'
  | 'users.manage'
  | 'users.admin' // смена роли пользователя, в том числе назначение администрации
  | 'reports.review' // принятие, отклонение и возврат отчётов на проверку
  | 'reports.create' // создание отчёта через веб-интерфейс (разработчик отчёты не создаёт)
  | 'reports.edit' // редактирование отчёта и замена его фото
  | 'reports.delete' // безвозвратное удаление отчёта
  | 'landfills.view' // раздел «Полигоны»: остальные роли работают только со своим полигоном
  | 'landfills.own' // страница своего полигона (ссылка в меню под логотипом)
  | 'landfills.edit' // правка полигона: администрация — только своего
  | 'landfills.manage' // создание, удаление и восстановление полигонов
  | 'landfills.filter' // фильтр по полигону в списках
  | 'landfills.assign' // выбор полигона при создании записи: остальные создают в своём полигоне
  | 'analytics.view' // аналитика полигона: сводка, график веса отходов и календарь отчётов
  | 'inactive.view' // неактивные (удалённые) записи в списках
  | 'inactive.restore' // восстановление удалённых записей

// Права описаны в одном месте и совпадают с сервером. Это только видимость в интерфейсе, проверку делает сервер.
// Каждая роль может всё, что предыдущая: оператор < контролер < администрация (свой полигон) < разработчик
const EMPLOYEE: readonly Permission[] = ['reports.create']

const ACCOUNTANT: readonly Permission[] = [
  ...EMPLOYEE,
  'reports.review',
  'reports.edit',
  'analytics.view',
]

const ADMIN: readonly Permission[] = [
  ...ACCOUNTANT,
  'reference.edit',
  'users.view',
  'users.manage',
  'users.admin',
  'reports.delete',
  'landfills.own',
  'landfills.edit',
  'inactive.view',
  'inactive.restore',
]

const MATRIX: Record<Role, readonly Permission[]> = {
  employee: EMPLOYEE,
  accountant: ACCOUNTANT,
  admin: ADMIN,
  // У разработчика нет полигона, поэтому отчёты он не создаёт
  developer: [
    ...ADMIN.filter((p) => p !== 'reports.create' && p !== 'landfills.own'),
    'landfills.view',
    'landfills.manage',
    'landfills.filter',
    'landfills.assign',
  ],
}

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value)

function decodePayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

type Claims = { role: Role | null; landfillId: string | null }

const NO_CLAIMS: Claims = { role: null, landfillId: null }

function readClaims(token: string | null): Claims {
  if (!token) return NO_CLAIMS
  try {
    const payload = decodePayload(token)
    const roleClaim = payload.role ?? payload[ROLE_CLAIM]
    const role = typeof roleClaim === 'string' ? roleClaim.toLowerCase() : null // сервер может прислать «Admin»
    return {
      role: isRole(role) ? role : null,
      landfillId:
        typeof payload.landfill === 'string' && payload.landfill ? payload.landfill : null,
    }
  } catch {
    return NO_CLAIMS
  }
}

function useClaims() {
  const token = useAccessToken()
  return useMemo(() => readClaims(token), [token])
}

export const useRole = () => useClaims().role

// Полигон, к которому привязан текущий пользователь (claim «landfill» в токене)
export const useOwnLandfillId = () => useClaims().landfillId

export const hasPermission = (role: Role | null, permission: Permission) =>
  role !== null && MATRIX[role].includes(permission)

export const useCan = (permission: Permission) => hasPermission(useRole(), permission)
