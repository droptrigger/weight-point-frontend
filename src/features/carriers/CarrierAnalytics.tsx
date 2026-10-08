import { formatKg, formatKgRounded } from '@/shared/lib/format'
import { ShareRing } from '@/shared/ui/ShareRing'
import { StatCards } from '@/shared/ui/StatCards'
import { useCarrierAnalytics } from './hooks'

// Плитки аналитики и доля перевозчика для правой колонки его страницы
// enabled = false — заглушка, пока грузится сам перевозчик
type Props = { carrierId: string; enabled?: boolean }

export function CarrierAnalytics({ carrierId, enabled = true }: Props) {
  const { data, isPending, isError } = useCarrierAnalytics(carrierId, enabled)

  if (isError) return <div className="state state-compact">Не удалось загрузить аналитику</div>

  return (
    <div className="detail-side">
      <StatCards
        compact
        loading={isPending}
        stats={[
          {
            label: 'Вывезено отходов всего',
            value: data && formatKg(data.totalNettoKg),
            active: true,
          },
          {
            label: 'Средний вес выгрузки за месяц',
            value: data && formatKgRounded(data.monthAverageNettoKg),
          },
        ]}
      />
      <ShareRing
        loading={isPending}
        percent={data?.sharePercent}
        label="от всех выгрузок полигона"
      />
    </div>
  )
}
