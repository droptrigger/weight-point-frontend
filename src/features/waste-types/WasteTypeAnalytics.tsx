import { formatKg, formatKgRounded } from '@/shared/lib/format'
import { ShareRing } from '@/shared/ui/ShareRing'
import { StatCards } from '@/shared/ui/StatCards'
import { useWasteTypeAnalytics } from './hooks'

// Плитки аналитики и доля вида отходов для правой колонки его страницы
// enabled = false — заглушка, пока грузится сам вид отходов
type Props = { wasteTypeId: string; enabled?: boolean }

export function WasteTypeAnalytics({ wasteTypeId, enabled = true }: Props) {
  const { data, isPending, isError } = useWasteTypeAnalytics(wasteTypeId, enabled)

  if (isError) return <div className="state state-compact">Не удалось загрузить аналитику</div>

  return (
    <div className="detail-side">
      <StatCards
        compact
        loading={isPending}
        stats={[
          { label: 'Отчётов', value: data?.reportsCount },
          { label: 'Вес отходов всего', value: data && formatKg(data.totalNettoKg), active: true },
          {
            label: 'Средний вес отходов за месяц',
            value: data && formatKgRounded(data.monthAverageNettoKg),
          },
        ]}
      />
      <ShareRing
        loading={isPending}
        percent={data?.sharePercent}
        label="от всего объёма отходов полигона"
      />
    </div>
  )
}
