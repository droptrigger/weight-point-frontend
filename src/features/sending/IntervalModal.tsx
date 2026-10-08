import type { SyntheticEvent } from 'react'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { SendingSettings } from './api'
import { useUpdateSchedule } from './hooks'
import { MAX_INTERVAL, MIN_INTERVAL } from './validation'

type Props = { open: boolean; settings: SendingSettings; onClose: () => void }
type Form = { sendIntervalMinutes: string }

// Включение и выключение — переключатель на карточке, здесь только интервал
export function IntervalModal({ open, settings, onClose }: Props) {
  return (
    <Modal open={open} title="Интервал проверки" onClose={onClose}>
      <IntervalForm settings={settings} onClose={onClose} />
    </Modal>
  )
}

function IntervalForm({ settings, onClose }: Omit<Props, 'open'>) {
  const save = useUpdateSchedule(settings.landfillId)
  const { form, set, error, validate } = useForm<Form>(
    { sendIntervalMinutes: String(settings.sendIntervalMinutes) },
    save.error,
  )

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const interval = Number(form.sendIntervalMinutes.trim())
    const errors: LocalErrors<keyof Form> = {}
    if (!Number.isInteger(interval) || interval < MIN_INTERVAL || interval > MAX_INTERVAL)
      errors.sendIntervalMinutes = `Целое число от ${MIN_INTERVAL} до ${MAX_INTERVAL}`
    if (!validate(errors)) return

    save.mutate(
      { autoSendEnabled: settings.autoSendEnabled, sendIntervalMinutes: interval },
      { onSuccess: onClose },
    )
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      <TextField
        id="sending-interval"
        label="Интервал проверки, минут"
        autoFocus
        inputMode="numeric"
        autoComplete="off"
        value={form.sendIntervalMinutes}
        onChange={set('sendIntervalMinutes')}
        error={error('sendIntervalMinutes')}
      />
      <p className="form-hint">
        С этим интервалом проверяется, есть ли отчёты «Ожидает отправки», и найденные уходят в ФГИС
        УТКО.
      </p>
      <FormError error={save.error} />
      <FormActions submitText="Сохранить" pending={save.isPending} onCancel={onClose} />
    </form>
  )
}
