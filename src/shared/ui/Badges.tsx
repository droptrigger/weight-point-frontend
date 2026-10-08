import { cx } from '@/shared/lib/cx'

type PlateProps = { number: string; region: string; large?: boolean }

export function PlateNumber({ number, region, large }: PlateProps) {
  return (
    <div className={cx('plate', large && 'plate-lg')}>
      <span className="plate-num">{number}</span>
      <span className="plate-region">{region}</span>
    </div>
  )
}

export function RoleBadge({ name }: { name?: string | null }) {
  return <span className="role-badge">{name || '—'}</span>
}

// Пометка удалённой записи в таблицах. Род зависит от сущности: «Неактивна» для машины
export function InactiveBadge({ label = 'Неактивен' }: { label?: string }) {
  return <span className="inactive-badge">{label}</span>
}

// Пометка о проблеме, требующей внимания (например, истекла лицензия на вид отходов)
export function WarningBadge({ label }: { label: string }) {
  return <span className="inactive-badge warning-badge">{label}</span>
}
