import type { UserDetails } from '@/features/users/api'
import { http } from '@/shared/api/http'
import { session, type Tokens } from '@/shared/api/session'

export type Credentials = { email: string; password: string }

export const authApi = {
  login: (body: Credentials) => http.post<Tokens>('/auth/login', body),
  logout: (refreshToken: string) => http.post<void>('/auth/logout', { refreshToken }),
  me: () => http.get<UserDetails>('/auth/me'),
}

export async function logout() {
  const tokens = session.get()
  try {
    if (tokens) await authApi.logout(tokens.refreshToken)
  } catch {
    // Сессия очищается локально в любом случае, чтобы ошибка сервера не мешала выйти
  } finally {
    session.clear()
  }
}
