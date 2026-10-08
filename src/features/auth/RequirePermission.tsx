import { Navigate, Outlet } from 'react-router-dom'
import { useCan, type Permission } from './permissions'

export function RequirePermission({ permission }: { permission: Permission }) {
  return useCan(permission) ? <Outlet /> : <Navigate to="/" replace />
}
