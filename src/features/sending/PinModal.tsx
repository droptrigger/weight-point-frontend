import type { SyntheticEvent } from 'react'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { FormActions, FormError } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { SendingSettings } from './api'
import { useSetPin } from './hooks'
import { PinField } from './PinField'
import { pinError } from './validation'

type Props = { open: boolean; settings: SendingSettings; onClose: () => void }
type Form = { currentPin: string; newPin: string; confirmPin: string }

// Смена ПИН-кода без замены ключей. Первый ПИН-код задаётся вместе с ключами (CredentialsModal)
export function PinModal({ open, settings, onClose }: Props) {
  return (
    <Modal open={open} title="Смена ПИН-кода" onClose={onClose}>
      <PinForm settings={settings} onClose={onClose} />
    </Modal>
  )
}

function PinForm({ settings, onClose }: Omit<Props, 'open'>) {
  const save = useSetPin(settings.landfillId)
  const { form, set, error, validate } = useForm<Form>(
    { currentPin: '', newPin: '', confirmPin: '' },
    save.error,
  )

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const errors: LocalErrors<keyof Form> = {}
    const currentError = pinError(form.currentPin)
    const newError = pinError(form.newPin)
    if (currentError) errors.currentPin = currentError
    if (newError) errors.newPin = newError
    else if (form.confirmPin !== form.newPin) errors.confirmPin = 'ПИН-коды не совпадают'
    if (!validate(errors)) return

    save.mutate({ currentPin: form.currentPin, newPin: form.newPin }, { onSuccess: onClose })
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      <PinField
        id="pin-current"
        label="Текущий ПИН-код"
        autoFocus
        value={form.currentPin}
        onChange={set('currentPin')}
        error={error('currentPin')}
      />
      <PinField
        id="pin-new"
        label="Новый ПИН-код"
        value={form.newPin}
        onChange={set('newPin')}
        error={error('newPin')}
      />
      <PinField
        id="pin-confirm"
        label="Повторите ПИН-код"
        value={form.confirmPin}
        onChange={set('confirmPin')}
        error={error('confirmPin')}
      />
      <p className="form-hint">
        Забыли текущий ПИН-код? Задайте ключи заново: вместе с ними задаётся новый ПИН-код.
      </p>
      <FormError error={save.error} />
      <FormActions submitText="Сменить" pending={save.isPending} onCancel={onClose} />
    </form>
  )
}
