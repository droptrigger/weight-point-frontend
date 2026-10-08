import { ChevronRight } from 'lucide-react'
import { rowClass } from '@/shared/lib/rowClass'
import { InactiveBadge, RoleBadge } from '@/shared/ui/Badges'
import { EntityLink } from '@/shared/ui/EntityLink'
import { StaticTable } from '@/shared/ui/StaticTable'
import { fullName, initials, type User } from './api'
import { USER_COLUMNS } from './columns'

export function UserRow({ user }: { user: User }) {
  return (
    <EntityLink to={`/users/${user.id}`} className={rowClass(user.isActive)}>
      <div className="user-cell">
        <span className="user-avatar">{initials(user)}</span>
        <span className="name-with-badge">
          <span className="cell-name">{fullName(user)}</span>
          {user.isActive === false && <InactiveBadge />}
        </span>
      </div>
      <div className="cell cell-email" data-label="Email">
        {user.email}
      </div>
      <div className="cell" data-label="Роль">
        <RoleBadge name={user.role} />
      </div>
      <div className="cell-arrow">
        <ChevronRight className="icon" />
      </div>
    </EntityLink>
  )
}

export function UsersTable({ items }: { items: User[] }) {
  return (
    <StaticTable
      className="list-users"
      columns={USER_COLUMNS}
      items={items}
      empty="Сотрудников нет"
      renderRow={(user) => <UserRow key={user.id} user={user} />}
    />
  )
}
