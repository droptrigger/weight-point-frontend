import { Field } from '@/shared/ui/Form'
import { PinCodeInput } from '@/shared/ui/PinCodeInput'
import { PIN_LENGTH } from './validation'

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  invalid?: boolean // красные ячейки без текста под полем: ошибка показана в другом месте
  half?: boolean
  autoFocus?: boolean
  onComplete?: (value: string) => void
}

// Поле ПИН-кода в форме: подпись, ячейки по одной цифре и ошибка под ними
export function PinField({
  id,
  label,
  value,
  onChange,
  error,
  invalid,
  half,
  autoFocus,
  onComplete,
}: Props) {
  return (
    <Field id={id} label={label} error={error} half={half}>
      <PinCodeInput
        id={id}
        length={PIN_LENGTH}
        value={value}
        onChange={onChange}
        invalid={invalid || Boolean(error)}
        autoFocus={autoFocus}
        onComplete={onComplete}
      />
    </Field>
  )
}
