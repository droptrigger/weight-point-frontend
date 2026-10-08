import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EntityHeadProps = {
  icon: LucideIcon
  label: string
  title: string
  aside?: ReactNode // пометка справа на уровне заголовка (например, «Лицензия истекла»)
}

export function EntityHead({ icon: Icon, label, title, aside }: EntityHeadProps) {
  return (
    <div className="entity-head">
      <span className="detail-icon detail-icon-lg">
        <Icon className="icon" />
      </span>
      <div>
        <div className="muted">{label}</div>
        <h2 className="entity-title">{title}</h2>
      </div>
      {aside && <div className="entity-head-aside">{aside}</div>}
    </div>
  )
}

export function InfoList({ children }: { children: ReactNode }) {
  return <dl className="info-list">{children}</dl>
}

export function InfoRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="info-row">
      <dt>{label}</dt>
      <dd>{children ?? '—'}</dd>
    </div>
  )
}
