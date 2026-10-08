import { useNavigate } from 'react-router-dom'
import { plural } from '@/shared/lib/format'
import { ActivityCalendar } from '@/shared/ui/ActivityCalendar'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useLandfillReportsCalendar } from './hooks'

const REPORT_FORMS: [string, string, string] = ['отчёт', 'отчёта', 'отчётов']
const DAY_FORMS: [string, string, string] = ['день', 'дня', 'дней']

const formatReports = (count: number) => (count ? plural(count, REPORT_FORMS) : 'Нет отчётов')

// Календарь отчётов полигона по дням за год. Нажатие на день открывает отчёты за этот день;
// landfillId в ссылке учитывает только разработчик, остальным сервер и так отдаёт свой полигон.
// enabled = false — заглушка, пока полигон не выбран
type Props = { landfillId: string; enabled?: boolean }

export function LandfillReportsCalendar({ landfillId, enabled = true }: Props) {
  const { data, isPending, isError } = useLandfillReportsCalendar(landfillId, enabled)
  const navigate = useNavigate()

  const openDay = (date: string) =>
    navigate(`/reports?${new URLSearchParams({ landfillId, from: date, to: date })}`)

  return (
    <section className="info-card chart-card" aria-busy={isPending || undefined}>
      <div className="chart-head">
        <div>
          <h2 className="chart-title">Отчёты по дням</h2>
          <div className="chart-total">
            {isPending ? (
              <Skeleton width={220} />
            ) : (
              data && (
                <>
                  <strong>{plural(data.totalReports, REPORT_FORMS)}</strong> за год
                  {data.activeDays > 0 && ` · ${plural(data.activeDays, DAY_FORMS)} с отчётами`}
                </>
              )
            )}
          </div>
        </div>
      </div>

      {isError ? (
        <div className="state state-compact">Не удалось загрузить отчёты по дням</div>
      ) : isPending ? (
        <Skeleton variant="block" height={150} />
      ) : (
        <ActivityCalendar
          days={data.days}
          max={data.maxDayReports}
          label="Отчёты полигона по дням за год"
          formatCount={formatReports}
          onSelect={openDay}
        />
      )}
    </section>
  )
}
