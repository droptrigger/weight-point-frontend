import { useState, type SyntheticEvent } from 'react'
import { FormActions, FormError } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { FgisCredentials, SendingSettings } from './api'
import { useRevealCredentials } from './hooks'
import { PinField } from './PinField'
import { pinError } from './validation'

type Props = {
  open: boolean
  settings: SendingSettings
  onClose: () => void
  onRevealed: (credentials: FgisCredentials) => void
}

// Запрос ПИН-кода перед показом ключей. Ключи уходят карточке, само окно их не показывает
export function RevealModal({ open, settings, onClose, onRevealed }: Props) {
  return (
    <Modal open={open} title="Введите ПИН-код" onClose={onClose}>
      <RevealForm settings={settings} onClose={onClose} onRevealed={onRevealed} />
    </Modal>
  )
}

function RevealForm({ settings, onClose, onRevealed }: Omit<Props, 'open'>) {
  const reveal = useRevealCredentials(settings.landfillId)
  const [pin, setPin] = useState('')
  const [localError, setLocalError] = useState<string>()

  const send = (value: string) => {
    if (reveal.isPending) return
    const error = pinError(value)
    setLocalError(error)
    if (error) return
    reveal.mutate(value, {
      onSuccess: (credentials) => {
        onRevealed(credentials)
        onClose()
      },
      // Неверный ПИН-код стирается, чтобы следующую попытку можно было сразу набирать заново
      onError: () => setPin(''),
    })
  }

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    send(pin)
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      <p className="modal-text form-field">Ключи откроются сразу после ввода последней цифры.</p>
      <PinField
        id="reveal-pin"
        label="ПИН-код"
        autoFocus
        value={pin}
        onChange={(value) => {
          setPin(value)
          setLocalError(undefined)
        }}
        error={localError}
        // Красные ячейки после неверного ПИН-кода, пока не начат новый ввод: текст ошибки ниже
        invalid={reveal.isError && !pin}
        onComplete={send}
      />
      <FormError error={reveal.error} />
      <FormActions submitText="Показать" pending={reveal.isPending} onCancel={onClose} />
    </form>
  )
}
