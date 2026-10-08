import { useState } from 'react'
import { cx } from '@/shared/lib/cx'

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  length?: number
  invalid?: boolean
  autoFocus?: boolean
  onComplete?: (value: string) => void // введена последняя цифра: можно отправлять без кнопки
}

// Ввод кода по ячейкам, как в Telegram. Под ячейками одно настоящее поле: вставка всего кода,
// Backspace, автозаполнение и экранный диктор работают как у обычного input, а ячейки только рисуют
// введённые цифры точками. Это не type="password", чтобы браузер не предлагал сохранить код как пароль
export function PinCodeInput({
  id,
  value,
  onChange,
  length = 6,
  invalid,
  autoFocus,
  onComplete,
}: Props) {
  const [focused, setFocused] = useState(false)
  // Курсор стоит в следующей пустой ячейке, а когда код введён полностью — в последней
  const active = Math.min(value.length, length - 1)

  return (
    <div className={cx('pin-code', invalid && 'invalid')}>
      <input
        id={id}
        className="pin-code-input"
        value={value}
        inputMode="numeric"
        maxLength={length}
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        data-1p-ignore=""
        data-lpignore="true"
        data-bwignore=""
        data-form-type="other"
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, length)
          onChange(next)
          if (next.length === length && value.length < length) onComplete?.(next)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // Для того чтобы цифры вводились по порядку, как в отдельных ячейках, курсор всегда в конце
        onSelect={(e) => {
          const el = e.currentTarget
          const end = el.value.length
          if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end)
        }}
      />
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          className={cx(
            'pin-code-cell',
            i < value.length && 'filled',
            focused && i === active && 'active',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
