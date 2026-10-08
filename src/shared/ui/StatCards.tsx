import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Skeleton } from './Skeleton'

export type StatItem = {
  label: string
  value?: ReactNode // нет значения — «—»
  sub?: ReactNode // подпись под значением
  active?: boolean // выделить карточку цветом
}

type Props = {
  stats: StatItem[]
  loading?: boolean
  compact?: boolean // плитки в две колонки для боковой колонки страницы
}

// Ряд карточек со статистикой: на время загрузки вместо значений заглушки
export function StatCards({ stats, loading = false, compact = false }: Props) {
  return (
    <section
      className={cx('stats', stats.length === 3 && 'stats-3', compact && 'stats-compact')}
      aria-busy={loading || undefined}
    >
      {stats.map(({ label, value, sub, active }) => (
        <div key={label} className={cx('stat', active && 'stat-active')}>
          <div className="stat-label">{label}</div>
          <div className="stat-value">
            {loading ? <Skeleton variant="stat" width="45%" /> : (value ?? '—')}
          </div>
          {sub && !loading && <div className="stat-sub">{sub}</div>}
        </div>
      ))}
    </section>
  )
}
