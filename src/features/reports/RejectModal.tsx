import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import { REJECT_COMMENT_MAX } from './reviewActions'

type Props = {
  open: boolean
  title: string
  text: string
  loading: boolean
  error?: string
  onClose: () => void
  onConfirm: (comment: string | undefined) => void
}

// Подтверждение отклонения с необязательной причиной: она попадает в историю статусов отчёта
export function RejectModal({ open, title, onClose, ...form }: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <RejectForm onClose={onClose} {...form} />
    </Modal>
  )
}

function RejectForm({ text, loading, error, onClose, onConfirm }: Omit<Props, 'open' | 'title'>) {
  const [comment, setComment] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onConfirm(comment.trim() || undefined)
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="modal-text">{text}</p>
      <div className="modal-form">
        <Field id="reject-comment" label="Причина (необязательно)">
          <textarea
            id="reject-comment"
            className="input input--textarea"
            rows={3}
            maxLength={REJECT_COMMENT_MAX}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Field>
      </div>
      {error && <div className="modal-error modal-error--spaced">{error}</div>}
      <div className="modal-actions">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" variant="danger" loading={loading}>
          Отклонить
        </Button>
      </div>
    </form>
  )
}
