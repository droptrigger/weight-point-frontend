import { cx } from '@/shared/lib/cx'
import { formatKg, formatKgRounded } from '@/shared/lib/format'
import { StatCards } from '@/shared/ui/StatCards'
import { useLandfillAnalytics } from './hooks'

type Props = {
  landfillId: string
  title?: string // без заголовка — компактные плитки для боковой колонки
  enabled?: boolean // false — заглушка, пока грузится сам полигон
  compact?: boolean // по умолчанию компактные плитки, когда нет заголовка
}

export function LandfillAnalytics({ landfillId, title, enabled = true, compact = !title }: Props) {
  const { data, isPending, isError } = useLandfillAnalytics(landfillId, enabled)
  const heading = title && <h2 className="section-title">{title}</h2>

  if (isError) {
    return (
      <>
        {heading}
        <div className={cx('state', compact && 'state-compact')}>
          Не удалось загрузить аналитику
        </div>
      </>
    )
  }

  return (
    <>
      {heading}
      <StatCards
        compact={compact}
        loading={isPending}
        stats={[
          { label: 'Отчётов за год', value: data?.reportsCount },
          { label: 'Вес отходов за год', value: data && formatKg(data.totalNettoKg), active: true },
          {
            label: 'Средний вес отходов за год',
            value: data && formatKgRounded(data.averageNettoKg),
          },
        ]}
      />
    </>
  )
}
