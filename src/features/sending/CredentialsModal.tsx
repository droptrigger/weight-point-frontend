import type { SyntheticEvent } from 'react'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import { hasCredentials, type SendingSettings } from './api'
import { useUpdateCredentials } from './hooks'
import { PinField } from './PinField'
import { GUID_EXAMPLE, guidError, pinError } from './validation'

type Props = { open: boolean; settings: SendingSettings; onClose: () => void }
type Form = { objectId: string; accessKey: string; newPin: string; confirmPin: string }

export function CredentialsModal({ open, settings, onClose }: Props) {
  return (
    <Modal
      open={open}
      title={hasCredentials(settings) ? 'Замена ключей ФГИС УТКО' : 'Ключи ФГИС УТКО'}
      onClose={onClose}
    >
      <CredentialsForm settings={settings} onClose={onClose} />
    </Modal>
  )
}

function CredentialsForm({ settings, onClose }: Omit<Props, 'open'>) {
  const save = useUpdateCredentials(settings.landfillId)
  // Текущие ключи целиком сюда не приходят: их вводят заново
  const { form, set, error, validate } = useForm<Form>(
    { objectId: '', accessKey: '', newPin: '', confirmPin: '' },
    save.error,
  )

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const errors: LocalErrors<keyof Form> = {}
    const objectIdError = guidError(form.objectId)
    const accessKeyError = guidError(form.accessKey)
    const pinErr = pinError(form.newPin)
    if (objectIdError) errors.objectId = objectIdError
    if (accessKeyError) errors.accessKey = accessKeyError
    if (pinErr) errors.newPin = pinErr
    else if (form.confirmPin !== form.newPin) errors.confirmPin = 'ПИН-коды не совпадают'
    if (!validate(errors)) return

    save.mutate(
      { objectId: form.objectId.trim(), accessKey: form.accessKey.trim(), newPin: form.newPin },
      { onSuccess: onClose },
    )
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      <TextField
        id="fgis-object-id"
        label="ObjectId"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        placeholder={GUID_EXAMPLE}
        value={form.objectId}
        onChange={set('objectId')}
        error={error('objectId')}
      />
      <TextField
        id="fgis-access-key"
        label="AccessKey"
        autoComplete="off"
        spellCheck={false}
        placeholder={GUID_EXAMPLE}
        value={form.accessKey}
        onChange={set('accessKey')}
        error={error('accessKey')}
      />
      <PinField
        id="fgis-new-pin"
        label="Новый ПИН-код"
        value={form.newPin}
        onChange={set('newPin')}
        error={error('newPin')}
      />
      <PinField
        id="fgis-confirm-pin"
        label="Повторите ПИН-код"
        value={form.confirmPin}
        onChange={set('confirmPin')}
        error={error('confirmPin')}
      />
      <p className="form-hint">
        ПИН-код понадобится, чтобы посмотреть ключи целиком.
        {settings.hasPin && ' Старый ПИН-код перестанет действовать.'}
      </p>
      <FormError error={save.error} />
      <FormActions submitText="Сохранить" pending={save.isPending} onCancel={onClose} />
    </form>
  )
}
