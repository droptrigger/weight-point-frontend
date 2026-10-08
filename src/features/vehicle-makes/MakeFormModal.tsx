import { useState, type SyntheticEvent } from 'react'
import { fieldError } from '@/shared/lib/fieldError'
import { FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { Make } from './api'
import { useCreateMake } from './hooks'

type Props = {
  open: boolean
  landfillId?: string // полигон машины, для которой добавляется марка (только у разработчика)
  onClose: () => void
  onCreated: (make: Make) => void
}

export function MakeFormModal({ open, landfillId, onClose, onCreated }: Props) {
  return (
    <Modal open={open} title="Новая марка" onClose={onClose}>
      <MakeForm landfillId={landfillId} onClose={onClose} onCreated={onCreated} />
    </Modal>
  )
}

function MakeForm({ landfillId, onClose, onCreated }: Omit<Props, 'open'>) {
  const [name, setName] = useState('')
  const create = useCreateMake()

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    create.mutate(
      { name: name.trim(), landfillId },
      {
        onSuccess: (make) => {
          onClose()
          onCreated(make)
        },
      },
    )
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      <TextField
        id="make-name"
        label="Название"
        autoFocus
        placeholder="КАМАЗ"
        value={name}
        onChange={setName}
        error={fieldError(create.error, {}, 'name')}
      />
      <FormError error={create.error} />
      <FormActions submitText="Добавить" pending={create.isPending} onCancel={onClose} />
    </form>
  )
}
