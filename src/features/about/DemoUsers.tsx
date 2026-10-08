import { Clock } from 'lucide-react'
import { ROLE_NAMES } from '@/features/users/roles'
import { RoleBadge } from '@/shared/ui/Badges'
import { DEMO_USERS } from './demoData'

// Пользователи полигона: по одному на роль, с шуточным описанием, чем каждый занят
export function DemoUsers() {
  return (
    <div className="demo-users">
      <div className="demo-page-head">
        <div>
          <h3>Пользователи</h3>
          <span className="demo-page-sub">Полигон «Северный» · у каждого свои права</span>
        </div>
      </div>

      <div className="demo-user-grid">
        {DEMO_USERS.map((u) => (
          <article key={u.name} className="demo-user">
            <div className="demo-user-head">
              <span className="user-avatar user-avatar-lg" aria-hidden="true">
                {u.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </span>
              <h4>{u.name}</h4>
            </div>
            <RoleBadge name={ROLE_NAMES[u.role]} />
            <p>{u.about}</p>
            <span className="demo-user-status">
              <Clock className="icon" />
              {u.status}
            </span>
          </article>
        ))}
      </div>
    </div>
  )
}
