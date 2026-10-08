import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  title: string
  description?: ReactNode
  code?: string // крупная подпись над заголовком, например «404»
  tone?: 'neutral' | 'danger'
  actions?: ReactNode
}

// Заглушка во всю область контента: запись не найдена, ошибка загрузки, неизвестный адрес
export function EmptyState({
  icon: Icon,
  title,
  description,
  code,
  tone = 'neutral',
  actions,
}: Props) {
  return (
    <div
      className={`empty-state empty-state--${tone}`}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <div className="empty-state-icon">
        <Icon className="icon" />
      </div>
      {code && <div className="empty-state-code">{code}</div>}
      <h2 className="empty-state-title">{title}</h2>
      {description && <p className="empty-state-text">{description}</p>}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  )
}
