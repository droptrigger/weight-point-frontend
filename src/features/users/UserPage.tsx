import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Calculator,
  ChevronRight,
  ShieldCheck,
  UserCog,
  UserLock,
  type LucideIcon,
} from 'lucide-react'
import { useMe } from '@/features/auth/hooks'
import { useCan } from '@/features/auth/permissions'
import { formatDateTime } from '@/shared/lib/format'
import { restoreAction } from '@/shared/lib/restoreAction'
import { useDeleteFlow } from '@/shared/lib/useDeleteFlow'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { RoleBadge } from '@/shared/ui/Badges'
import { Button } from '@/shared/ui/Button'
import { DetailPage } from '@/shared/ui/DetailPage'
import { EntityActions } from '@/shared/ui/EntityActions'
import { EntityLink } from '@/shared/ui/EntityLink'
import { InfoList, InfoRow } from '@/shared/ui/InfoCard'
import { ConfirmModal } from '@/shared/ui/Modal'
import { fullName, initials, type PromoteTarget, type UserDetails } from './api'
import { useDeleteUser, usePromoteUser, useRestoreUser, useUser } from './hooks'
import { ROLE_IDS, ROLE_NAMES } from './roles'
import { UserFormModal } from './UserFormModal'

// Смена роли: кнопка видна, если у пользователя сейчас другая роль
const PROMOTIONS: { to: PromoteTarget; icon: LucideIcon; label: string }[] = [
  { to: 'admin', icon: ShieldCheck, label: 'Перевести в администрацию организации' },
  { to: 'accountant', icon: Calculator, label: 'Назначить контролером полигона' },
  { to: 'employee', icon: UserCog, label: 'Назначить оператором полигона' },
]

export function UserPage() {
  const id = useParams().id ?? ''
  const query = useUser(id)

  return (
    <DetailPage
      title="Пользователь"
      backTo="/users"
      query={query}
      notFound="Пользователь не найден"
      failed="Не удалось загрузить пользователя"
    >
      {(user) => <UserView user={user} />}
    </DetailPage>
  )
}

function UserView({ user: u }: { user: UserDetails }) {
  // Свою роль и блокировку сервер менять не даёт: так администрация не лишит себя прав по ошибке
  const isSelf = useMe().data?.id === u.id
  const canManage = useCan('users.manage')
  const canChangeRole = useCan('users.admin') && !isSelf
  const promotions = canChangeRole ? PROMOTIONS.filter(({ to }) => u.role.id !== ROLE_IDS[to]) : []
  const canSeeLandfills = useCan('landfills.view')
  const edit = useDisclosure()
  const remove = useDeleteFlow(useDeleteUser(), '/users')
  const canRestore = useCan('inactive.restore')
  const restore = useRestoreUser()
  const promote = usePromoteUser()
  const [promoteTo, setPromoteTo] = useState<PromoteTarget | null>(null)

  const closePromote = () => {
    setPromoteTo(null)
    promote.reset()
  }

  return (
    <>
      <section className="info-card entity-card">
        <div className="entity-head">
          <span className="user-avatar user-avatar-lg">{initials(u)}</span>
          <div>
            <div className="muted">Пользователь</div>
            <h2 className="entity-title">{fullName(u)}</h2>
          </div>
        </div>

        <InfoList>
          <InfoRow label="Email">
            <a className="info-link" href={`mailto:${u.email}`}>
              {u.email}
            </a>
          </InfoRow>
          <InfoRow label="Роль">
            <RoleBadge name={u.role.name} />
          </InfoRow>
          <InfoRow label="Полигон">
            {u.landfill &&
              (canSeeLandfills ? (
                <EntityLink className="info-link" to={`/landfills/${u.landfill.id}`}>
                  {u.landfill.name}
                  <ChevronRight className="icon" />
                </EntityLink>
              ) : (
                u.landfill.name
              ))}
          </InfoRow>
          <InfoRow label="Добавлен">{formatDateTime(u.createdAt)}</InfoRow>
          <InfoRow label="ID">{u.id}</InfoRow>
        </InfoList>

        {promotions.length > 0 && (
          <div className="entity-actions entity-actions--flat">
            {promotions.map(({ to, icon: Icon, label }) => (
              <Button key={to} variant="soft" onClick={() => setPromoteTo(to)}>
                <Icon className="icon" />
                {label}
              </Button>
            ))}
          </div>
        )}

        {canManage && (
          <EntityActions
            onEdit={edit.show}
            onDelete={isSelf ? undefined : remove.show}
            inactive={!u.isActive}
            restore={restoreAction(restore, u.id, canRestore && !u.isActive)}
            deleteLabel="Заблокировать"
            deleteIcon={UserLock}
            restoreLabel="Разблокировать"
          />
        )}
      </section>

      <UserFormModal open={edit.open} user={u} onClose={edit.hide} />
      <ConfirmModal
        open={promoteTo !== null}
        title="Изменить роль?"
        text={`Назначить «${fullName(u)}» роль «${promoteTo ? ROLE_NAMES[promoteTo] : ''}»?`}
        confirmText="Изменить"
        loading={promote.isPending}
        error={promote.error?.message}
        onClose={closePromote}
        onConfirm={() => {
          if (promoteTo) promote.mutate({ id: u.id, to: promoteTo }, { onSuccess: closePromote })
        }}
      />
      <ConfirmModal
        open={remove.open}
        title="Заблокировать пользователя?"
        text={`Заблокировать «${fullName(u)}»? Пользователь не сможет войти в систему, пока его не разблокируют.`}
        confirmText="Заблокировать"
        danger
        loading={remove.loading}
        error={remove.error}
        onClose={remove.close}
        onConfirm={() => remove.confirm(u.id)}
      />
    </>
  )
}
