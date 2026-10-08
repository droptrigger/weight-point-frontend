import type { ReactNode } from 'react'
import { Pencil, RotateCcw, Trash2, type LucideIcon } from 'lucide-react'
import type { DeleteFlow } from '@/shared/lib/useDeleteFlow'
import { Button } from './Button'
import { ConfirmModal } from './Modal'

// Восстановление удалённой записи: передаётся, только если запись неактивна и есть право
export type RestoreAction = {
  run: () => void
  loading: boolean
  error?: string
}

type ActionsProps = {
  onEdit: () => void
  onDelete?: () => void // без обработчика кнопки удаления нет (например, своя учётная запись)
  inactive?: boolean // запись удалена: «Удалить» не показывается
  restore?: RestoreAction // у удалённой записи вместо «Удалить» — «Восстановить»
  children?: ReactNode // дополнительные кнопки перед «Редактировать»
  // Подписи для записей, которые не удаляются, а блокируются (пользователи)
  deleteLabel?: string
  deleteIcon?: LucideIcon
  restoreLabel?: string
}

export function EntityActions({
  onEdit,
  onDelete,
  inactive,
  restore,
  children,
  deleteLabel = 'Удалить',
  deleteIcon: DeleteIcon = Trash2,
  restoreLabel = 'Восстановить',
}: ActionsProps) {
  return (
    <>
      <div className="entity-actions">
        {children}
        <Button variant="soft" onClick={onEdit}>
          <Pencil className="icon" />
          Редактировать
        </Button>
        {restore ? (
          <Button variant="soft" loading={restore.loading} onClick={restore.run}>
            {!restore.loading && <RotateCcw className="icon" />}
            {restoreLabel}
          </Button>
        ) : (
          !inactive &&
          onDelete && (
            <Button variant="danger-soft" onClick={onDelete}>
              <DeleteIcon className="icon" />
              {deleteLabel}
            </Button>
          )
        )}
      </div>
      {restore?.error && <div className="modal-error modal-error--spaced">{restore.error}</div>}
    </>
  )
}

type DeleteDialogProps<Id> = {
  flow: DeleteFlow<Id>
  id: Id
  name: string
  subject?: string // «Удалить машину «А123БВ 35»?»
}

export function DeleteDialog<Id>({ flow, id, name, subject }: DeleteDialogProps<Id>) {
  return (
    <ConfirmModal
      open={flow.open}
      title="Удалить?"
      text={`Удалить ${subject ? `${subject} ` : ''}«${name}»? Это действие нельзя отменить.`}
      confirmText="Удалить"
      danger
      loading={flow.loading}
      error={flow.error}
      onClose={flow.close}
      onConfirm={() => flow.confirm(id)}
    />
  )
}
