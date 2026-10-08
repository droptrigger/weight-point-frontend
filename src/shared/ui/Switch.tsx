import { cx } from '@/shared/lib/cx'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string // для экранного диктора: что включает переключатель
  disabled?: boolean
  loading?: boolean // изменение сохраняется: переключатель недоступен до ответа
}

// Переключатель «вкл/выкл», который срабатывает сразу, без кнопки «Сохранить»
export function Switch({ checked, onChange, label, disabled, loading }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={loading || undefined}
      className={cx('switch', checked && 'is-on')}
      disabled={disabled || loading}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" />
    </button>
  )
}
