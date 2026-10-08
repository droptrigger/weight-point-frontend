import type { SyntheticEvent } from 'react'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { Landfill } from './api'
import { useSaveLandfill } from './hooks'

type Props = { open: boolean; landfill?: Landfill; onClose: () => void }
type Form = { name: string; latitude: string; longitude: string }

const toNumber = (value: string) => Number(value.trim().replace(',', '.'))

const isCoordinate = (value: string, limit: number) => {
  const n = toNumber(value)
  return value.trim() !== '' && Number.isFinite(n) && Math.abs(n) <= limit
}

export function LandfillFormModal({ open, landfill, onClose }: Props) {
  return (
    <Modal
      open={open}
      title={landfill ? 'Редактирование полигона' : 'Новый полигон'}
      onClose={onClose}
    >
      <LandfillForm landfill={landfill} onClose={onClose} />
    </Modal>
  )
}

function LandfillForm({ landfill, onClose }: Omit<Props, 'open'>) {
  const save = useSaveLandfill()
  const { form, set, error, validate } = useForm<Form>(
    {
      name: landfill?.name ?? '',
      latitude: landfill ? String(landfill.latitude) : '',
      longitude: landfill ? String(landfill.longitude) : '',
    },
    save.error,
  )

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const errors: LocalErrors<keyof Form> = {}
    if (!form.name.trim()) errors.name = 'Заполните поле'
    if (!isCoordinate(form.latitude, 90)) errors.latitude = 'Число от -90 до 90'
    if (!isCoordinate(form.longitude, 180)) errors.longitude = 'Число от -180 до 180'
    if (!validate(errors)) return

    const data = {
      name: form.name.trim(),
      latitude: toNumber(form.latitude),
      longitude: toNumber(form.longitude),
    }
    save.mutate({ id: landfill?.id, data }, { onSuccess: onClose })
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      <TextField
        id="landfill-name"
        label="Название"
        autoFocus
        value={form.name}
        onChange={set('name')}
        error={error('name')}
      />
      <TextField
        id="landfill-latitude"
        label="Широта"
        half
        inputMode="decimal"
        placeholder="59.9386"
        value={form.latitude}
        onChange={set('latitude')}
        error={error('latitude')}
      />
      <TextField
        id="landfill-longitude"
        label="Долгота"
        half
        inputMode="decimal"
        placeholder="30.3141"
        value={form.longitude}
        onChange={set('longitude')}
        error={error('longitude')}
      />
      <FormError error={save.error} />
      <FormActions
        submitText={landfill ? 'Сохранить' : 'Добавить'}
        pending={save.isPending}
        onCancel={onClose}
      />
    </form>
  )
}
