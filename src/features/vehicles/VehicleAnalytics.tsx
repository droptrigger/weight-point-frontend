import { formatKg, formatKgRounded } from '@/shared/lib/format'
import { StatCards } from '@/shared/ui/StatCards'
import { useVehicleAnalytics } from './hooks'

// Компактные плитки аналитики для правой колонки страницы машины
// enabled = false — заглушка, пока грузится сама машина
type Props = { vehicleId: string; enabled?: boolean }

export function VehicleAnalytics({ vehicleId, enabled = true }: Props) {
  const { data, isPending, isError } = useVehicleAnalytics(vehicleId, enabled)

  if (isError) return <div className="state state-compact">Не удалось загрузить аналитику</div>

  return (
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
  )
}
