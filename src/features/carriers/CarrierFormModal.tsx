import type { SyntheticEvent } from 'react'
import { useCan } from '@/features/auth/permissions'
import { LandfillField } from '@/features/landfills/LandfillField'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { Carrier, CarrierDetails } from './api'
import { useSaveCarrier } from './hooks'

type Props = {
  open: boolean
  carrier?: Carrier
  // Добавление из формы машины: полигон уже выбран в ней (только у разработчика)
  landfillId?: string
  onClose: () => void
  onCreated?: (carrier: CarrierDetails) => void
}
type Form = { name: string; landfillId: string }

export function CarrierFormModal({ open, carrier, landfillId, onClose, onCreated }: Props) {
  return (
    <Modal
      open={open}
      title={carrier ? 'Редактирование перевозчика' : 'Новый перевозчик'}
      onClose={onClose}
    >
      <CarrierForm
        carrier={carrier}
        landfillId={landfillId}
        onClose={onClose}
        onCreated={onCreated}
      />
    </Modal>
  )
}

function CarrierForm({ carrier, landfillId, onClose, onCreated }: Omit<Props, 'open'>) {
  const save = useSaveCarrier()
  const { form, set, error, validate } = useForm<Form>(
    { name: carrier?.name ?? '', landfillId: '' },
    save.error,
  )
  // Полигон выбирает только разработчик и только при создании: перевозчик не переезжает.
  // Из формы машины полигон приходит готовым
  const canAssign = useCan('landfills.assign')
  const chooseLandfill = canAssign && !carrier && !landfillId

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const errors: LocalErrors<keyof Form> = {}
    if (chooseLandfill && !form.landfillId) errors.landfillId = 'Выберите полигон'
    if (!validate(errors)) return

    save.mutate(
      {
        id: carrier?.id,
        name: form.name.trim(),
        landfillId: chooseLandfill ? form.landfillId : canAssign ? landfillId : undefined,
      },
      {
        onSuccess: (saved) => {
          onClose()
          onCreated?.(saved)
        },
      },
    )
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      {chooseLandfill && (
        <LandfillField
          id="carrier-landfill"
          value={form.landfillId}
          onChange={set('landfillId')}
          error={error('landfillId')}
        />
      )}
      <TextField
        id="carrier-name"
        label="Название"
        autoFocus
        value={form.name}
        onChange={set('name')}
        error={error('name')}
      />
      <FormError error={save.error} />
      <FormActions
        submitText={carrier ? 'Сохранить' : 'Добавить'}
        pending={save.isPending}
        onCancel={onClose}
      />
    </form>
  )
}
