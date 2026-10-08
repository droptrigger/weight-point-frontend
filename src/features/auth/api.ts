import type { UserDetails } from '@/features/users/api'
import { ApiError, http } from '@/shared/api/http'
import { session, type Tokens } from '@/shared/api/session'

export type Credentials = { email: string; password: string }

export const authApi = {
  login: (body: Credentials) => http.post<Tokens>('/auth/login', body),
  logout: (refreshToken: string) => http.post<void>('/auth/logout', { refreshToken }),
  me: () => http.get<UserDetails>('/auth/me').catch(endMissingAccount),
}

// Токен ещё действителен, но учётной записи по нему нет (удалена, заблокирована или это другая
// база). Работать с такой сессией нельзя, поэтому она завершается, а RequireAuth уводит на /login.
function endMissingAccount(error: unknown): never {
  if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
    session.clear('Учётная запись не найдена или заблокирована. Войдите снова.')
  }
  throw error
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
