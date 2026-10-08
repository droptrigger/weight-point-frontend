import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { useDialog } from '@/shared/lib/useDialog'
import { Button } from './Button'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  wide?: boolean // для форм с полями в два столбца
  children: ReactNode
}

// <dialog> сам держит фокус внутри, закрывается по Esc и рисует подложку.
// Содержимое монтируется только при открытии, поэтому формы внутри каждый раз стартуют заново.
// Сам <dialog> — прозрачный слой на весь экран с прокруткой, окно — карточка в нём: на низком
// экране окно прокручивается целиком, а выпадающие списки не обрезаются
export function Modal({ open, title, onClose, wide, children }: ModalProps) {
  const ref = useDialog(open)

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={(e) => {
        // React всплывает close по дереву компонентов: закрытие вложенного окна не закрывает это
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className={cx('modal-panel', wide && 'modal-panel--wide')}>
          <h2 className="modal-title">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  )
}

type ConfirmModalProps = {
  open: boolean
  title: string
  text: string
  confirmText: string
  danger?: boolean
  loading?: boolean
  error?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  open,
  title,
  text,
  confirmText,
  danger,
  loading,
  error,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="modal-text">{text}</p>
      {error && <div className="modal-error modal-error--spaced">{error}</div>}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
