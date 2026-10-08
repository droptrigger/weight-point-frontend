import { UserRound } from 'lucide-react'
import { fullName, initials } from '@/features/users/api'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useMe } from './hooks'

// Карточка текущего пользователя в шапке: аватар, имя и роль
export function CurrentUser() {
  const { data: me, isPending } = useMe()

  return (
    <div className="account">
      <span className="user-avatar" aria-hidden="true">
        {me ? initials(me) : <UserRound className="icon" />}
      </span>
      <div className="account-info">
        {me ? (
          <>
            <span className="account-name">{fullName(me)}</span>
            <span className="account-role">{me.role.name}</span>
          </>
        ) : (
          isPending && (
            <>
              <Skeleton width={120} />
              <Skeleton width={80} height={12} />
            </>
          )
        )}
      </div>
    </div>
  )
}
