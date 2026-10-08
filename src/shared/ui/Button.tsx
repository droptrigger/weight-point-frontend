import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/shared/lib/cx'

type Variant = 'primary' | 'ghost' | 'soft' | 'danger' | 'danger-soft'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean // спиннер слева от текста, кнопка недоступна
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  )
}
