import type { ReactNode } from 'react'
import { CircleAlert, Info } from 'lucide-react'
import { cx } from '@/shared/lib/cx'

type Props = {
  tone?: 'info' | 'danger' // danger — ошибка или блокировка, которую нужно заметить
  children: ReactNode
}

// Пояснение в карточке: иконка в кружке и текст на мягком фоне, чтобы не терялось между блоками
export function Notice({ tone = 'info', children }: Props) {
  const Icon = tone === 'danger' ? CircleAlert : Info
  return (
    <div
      className={cx('notice', tone === 'danger' && 'notice--danger')}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <Icon className="notice-icon" aria-hidden="true" />
      <p className="notice-text">{children}</p>
    </div>
  )
}
