import type { ChangeEvent, SyntheticEvent } from 'react'
import { useCan } from '@/features/auth/permissions'
import { LandfillField } from '@/features/landfills/LandfillField'
import { cx } from '@/shared/lib/cx'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { DatePicker } from '@/shared/ui/DateTimePicker'
import { CheckField, Field, FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { WasteTypeDetails } from './api'
import { CODE_LENGTH, codeDigits, formatCodeDigits } from './code'
import { useSaveWasteType } from './hooks'

type Props = { open: boolean; item?: WasteTypeDetails; onClose: () => void }
type Form = {
  code: string // только цифры, пробелы добавляются при выводе
  name: string
  licenseNumber: string
  validUntil: string // YYYY-MM-DD или пусто
  requiresSending: boolean
  landfillId: string
}

export function WasteTypeFormModal({ open, item, onClose }: Props) {
  return (
    <Modal
      open={open}
      title={item ? 'Редактирование вида отходов' : 'Новый вид отходов'}
      onClose={onClose}
    >
      <WasteTypeForm item={item} onClose={onClose} />
    </Modal>
  )
}

function WasteTypeForm({ item, onClose }: Omit<Props, 'open'>) {
  const save = useSaveWasteType()
  const { form, set, error, validate } = useForm<Form>(
    {
      code: codeDigits(item?.code ?? ''),
      name: item?.name ?? '',
      licenseNumber: item?.licenseNumber ?? '',
      validUntil: item?.validUntil ?? '',
      requiresSending: item?.requiresSending ?? true,
      landfillId: '',
    },
    save.error,
  )
  // Полигон выбирает только разработчик и только при создании
  const chooseLandfill = useCan('landfills.assign') && !item

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const data = {
      code: form.code,
      name: form.name.trim(),
      requiresSending: form.requiresSending,
      licenseNumber: form.licenseNumber.trim() || null,
      validUntil: form.validUntil || null,
      landfillId: chooseLandfill ? form.landfillId : undefined,
    }
    const errors: LocalErrors<keyof Form> = {}
    if (chooseLandfill && !form.landfillId) errors.landfillId = 'Выберите полигон'
    if (!data.code) errors.code = 'Заполните поле'
    else if (data.code.length !== CODE_LENGTH) errors.code = `Код состоит из ${CODE_LENGTH} цифр`
    if (!data.name) errors.name = 'Заполните поле'
    if (!validate(errors)) return
    save.mutate({ id: item?.id, data }, { onSuccess: onClose })
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      {chooseLandfill && (
        <LandfillField
          id="waste-landfill"
          value={form.landfillId}
          onChange={set('landfillId')}
          error={error('landfillId')}
        />
      )}
      <CodeField value={form.code} onChange={set('code')} error={error('code')} />
      <TextField
        id="waste-name"
        label="Название"
        placeholder="Отходы бумаги"
        value={form.name}
        onChange={set('name')}
        error={error('name')}
      />
      <TextField
        id="waste-license"
        label="Номер лицензии"
        half
        autoComplete="off"
        value={form.licenseNumber}
        onChange={set('licenseNumber')}
        error={error('licenseNumber')}
      />
      <Field id="waste-valid-until" label="Лицензия действует до" half error={error('validUntil')}>
        <DatePicker
          id="waste-valid-until"
          value={form.validUntil}
          invalid={Boolean(error('validUntil'))}
          onChange={set('validUntil')}
        />
      </Field>
      <CheckField
        id="waste-requires-sending"
        label="Отправлять отчёты в ФГИС УТКО"
        checked={form.requiresSending}
        onChange={set('requiresSending')}
      />
      <FormError error={save.error} />
      <FormActions
        submitText={item ? 'Сохранить' : 'Добавить'}
        pending={save.isPending}
        onCancel={onClose}
      />
    </form>
  )
}

type CodeFieldProps = { value: string; onChange: (digits: string) => void; error?: string }

// Поле кода: в состоянии хранятся только цифры, в поле они показываются группами
function CodeField({ value, onChange, error }: CodeFieldProps) {
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const caret = input.selectionStart ?? input.value.length
    let digits = codeDigits(input.value)
    let digitsBeforeCaret = codeDigits(input.value.slice(0, caret)).length

    // Backspace по пробелу-разделителю удаляет цифру перед ним, иначе курсор «застревает»
    const deleteBackward = (e.nativeEvent as InputEvent).inputType === 'deleteContentBackward'
    if (deleteBackward && digits === value && digitsBeforeCaret > 0) {
      digits = digits.slice(0, digitsBeforeCaret - 1) + digits.slice(digitsBeforeCaret)
      digitsBeforeCaret--
    }
    const formatted = formatCodeDigits(digits)

    // Курсор остаётся после той же цифры, что и до переформатирования. Значение в DOM
    // обновляется сразу: React увидит совпадение и не сбросит курсор в конец
    let pos = 0
    for (let seen = 0; pos < formatted.length && seen < digitsBeforeCaret; pos++) {
      if (formatted[pos] !== ' ') seen++
    }
    input.value = formatted
    input.setSelectionRange(pos, pos)
    onChange(digits)
  }

  return (
    <Field id="waste-code" label="Код" error={error}>
      <input
        id="waste-code"
        className={cx('input', error && 'invalid')}
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        placeholder="1 00 000 00 00 0"
        value={formatCodeDigits(value)}
        onChange={change}
      />
    </Field>
  )
}
