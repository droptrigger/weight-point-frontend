import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useCan, useOwnLandfillId } from './permissions'

// Страница полигона: разработчику — любого, администрации — только своего
export function RequireLandfillAccess() {
  const id = useParams().id
  const ownLandfillId = useOwnLandfillId()
  const canSeeAll = useCan('landfills.view')
  const canSeeOwn = useCan('landfills.own') && id !== undefined && id === ownLandfillId
  return canSeeAll || canSeeOwn ? <Outlet /> : <Navigate to="/" replace />
}
