import { Navigate, Outlet } from 'react-router-dom'
import { useIsAuthed } from '@/shared/api/session'

// Без токенов доступен только /login
export function RequireAuth() {
  return useIsAuthed() ? <Outlet /> : <Navigate to="/login" replace />
}
