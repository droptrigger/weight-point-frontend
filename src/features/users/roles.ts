import type { Role } from '@/features/auth/permissions'

// id ролей на сервере
export const ROLE_IDS: Record<Role, number> = { employee: 1, accountant: 2, admin: 3, developer: 4 }

export const ROLE_NAMES: Record<Role, string> = {
  employee: 'Оператор полигона',
  accountant: 'Контролер полигона',
  admin: 'Администрация организации',
  developer: 'Разработчик',
}

export const ROLES = (Object.keys(ROLE_IDS) as Role[]).map((role) => ({
  id: ROLE_IDS[role],
  name: ROLE_NAMES[role],
}))
