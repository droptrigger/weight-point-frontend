import type { InputHTMLAttributes, ReactNode } from 'react'
import { ApiError } from '@/shared/api/http'
import { cx } from '@/shared/lib/cx'
import { caretAfterFormat, formatNumberInput } from '@/shared/lib/numberInput'
import { Button } from './Button'

type FieldProps = {
  id: string
  label: string
  error?: string
  half?: boolean // половина ширины строки формы
  children: ReactNode
}

export function Field({ id, label, error, half, children }: FieldProps) {
  return (
    <div className={cx('form-field', half && 'half')}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {children}
      <div className="field-error">{error}</div>
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  half?: boolean
}

export function TextField({ id, label, value, onChange, error, half, ...input }: TextFieldProps) {
  return (
    <Field id={id} label={label} error={error} half={half}>
      <input
        id={id}
        className={cx('input', error && 'invalid')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...input}
      />
    </Field>
  )
}

// Число с разрядами: 1000 → 1 000 прямо при вводе, курсор остаётся на своём месте
export function NumberField({ id, label, value, onChange, error, half, ...input }: TextFieldProps) {
  return (
    <Field id={id} label={label} error={error} half={half}>
      <input
        id={id}
        className={cx('input', error && 'invalid')}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const el = e.target
          const formatted = formatNumberInput(el.value)
          const caret = caretAfterFormat(el.value, el.selectionStart ?? el.value.length, formatted)
          // Для того чтобы React увидел то же значение и не сбросил курсор, значение и курсор ставятся вручную
          el.value = formatted
          el.setSelectionRange(caret, caret)
          onChange(formatted)
        }}
        {...input}
      />
    </Field>
  )
}

type CheckFieldProps = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckField({ id, label, checked, onChange }: CheckFieldProps) {
  return (
    <label className="form-field check-field" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

// Общая ошибка запроса, если сервер не привязал её к конкретным полям
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  if (error instanceof ApiError && error.hasFieldErrors) return null
  const message = error instanceof Error ? error.message : 'Не удалось выполнить запрос'
  return <div className="modal-error">{message}</div>
}

type FormActionsProps = {
  submitText: string
  pending: boolean
  onCancel: () => void
  children?: ReactNode // дополнительные кнопки между «Отмена» и основной
}

export function FormActions({ submitText, pending, onCancel, children }: FormActionsProps) {
  return (
    <div className="modal-actions form-field">
      <Button variant="ghost" onClick={onCancel}>
        Отмена
      </Button>
      {children}
      <Button type="submit" loading={pending}>
        {submitText}
      </Button>
    </div>
  )
}
