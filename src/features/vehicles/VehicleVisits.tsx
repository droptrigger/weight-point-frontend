import { useNavigate } from 'react-router-dom'
import { plural } from '@/shared/lib/format'
import { ActivityCalendar } from '@/shared/ui/ActivityCalendar'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useVehicleVisits } from './hooks'

const VISIT_FORMS: [string, string, string] = ['посещение', 'посещения', 'посещений']
const DAY_FORMS: [string, string, string] = ['день', 'дня', 'дней']

const formatVisits = (count: number) => (count ? plural(count, VISIT_FORMS) : 'Нет посещений')

// Календарь посещений полигона машиной за год: одно посещение — один отчёт.
// Нажатие на день открывает отчёты машины за этот день.
// enabled = false — заглушка, пока грузится сама машина
type Props = { vehicleId: string; enabled?: boolean }

export function VehicleVisits({ vehicleId, enabled = true }: Props) {
  const { data, isPending, isError } = useVehicleVisits(vehicleId, enabled)
  const navigate = useNavigate()

  const openDay = (date: string) =>
    navigate(`/reports?${new URLSearchParams({ vehicleId, from: date, to: date })}`)

  return (
    <section className="info-card chart-card" aria-busy={isPending || undefined}>
      <div className="chart-head">
        <div>
          <h2 className="chart-title">Посещения полигона</h2>
          <div className="chart-total">
            {isPending ? (
              <Skeleton width={220} />
            ) : (
              data && (
                <>
                  <strong>{plural(data.totalVisits, VISIT_FORMS)}</strong> за год
                  {data.activeDays > 0 && ` · ${plural(data.activeDays, DAY_FORMS)} с посещениями`}
                </>
              )
            )}
          </div>
        </div>
      </div>

      {isError ? (
        <div className="state state-compact">Не удалось загрузить посещения</div>
      ) : isPending ? (
        <Skeleton variant="block" height={150} />
      ) : (
        <ActivityCalendar
          days={data.days}
          max={data.maxDayVisits}
          label="Посещения полигона по дням за год"
          formatCount={formatVisits}
          onSelect={openDay}
        />
      )}
    </section>
  )
}
