import { useState } from 'react'
import { periodCaption, type ChartPeriod } from '@/shared/lib/chart'
import { formatNumber, plural } from '@/shared/lib/format'
import { ActivityCalendar } from '@/shared/ui/ActivityCalendar'
import { LineChart } from '@/shared/ui/LineChart'
import { PeriodSwitch } from '@/shared/ui/PeriodSwitch'
import { StatCards } from '@/shared/ui/StatCards'
import { DEMO_REPORT_DAYS, DEMO_SERIES } from './demoData'

const REPORT_FORMS: [string, string, string] = ['отчёт', 'отчёта', 'отчётов']

const formatTonnes = (v: number) => `${formatNumber(Math.round(v))} т`
const formatReports = (count: number) => (count ? plural(count, REPORT_FORMS) : 'Нет отчётов')

const yearTonnes = DEMO_SERIES.year.points.reduce((sum, p) => sum + p.value, 0)
const yearReports = DEMO_REPORT_DAYS.days.reduce((sum, d) => sum + d.count, 0)

// Аналитика полигона на тех же графиках, что и в системе, по выдуманным данным
export function DemoAnalytics() {
  const [period, setPeriod] = useState<ChartPeriod>('month')
  const series = DEMO_SERIES[period]
  const total = series.points.reduce((sum, p) => sum + p.value, 0)
  const caption = periodCaption(period)

  return (
    <div className="demo-analytics">
      <div className="demo-page-head">
        <div>
          <h3>Полигон «Северный»</h3>
          <span className="demo-page-sub">Аналитика за год</span>
        </div>
      </div>

      <StatCards
        stats={[
          { label: 'Принято отходов', value: formatTonnes(yearTonnes), active: true },
          { label: 'Отчётов', value: formatNumber(yearReports) },
          {
            label: 'Средний вес отходов',
            value: `${formatNumber(Math.round((yearTonnes / yearReports) * 1000))} кг`,
          },
        ]}
      />

      <section className="info-card chart-card">
        <div className="chart-head">
          <div>
            <h4 className="chart-title">Вес отходов</h4>
            <div className="chart-total">
              <strong>{formatTonnes(total)}</strong> {caption}
            </div>
          </div>
          <PeriodSwitch value={period} onChange={setPeriod} />
        </div>
        <LineChart
          points={series.points}
          step={series.step}
          label={`Вес отходов ${caption}`}
          formatValue={formatTonnes}
          height={220}
        />
      </section>

      <section className="info-card chart-card">
        <div className="chart-head">
          <div>
            <h4 className="chart-title">Отчёты по дням</h4>
            <div className="chart-total">
              <strong>{plural(yearReports, REPORT_FORMS)}</strong> за год
            </div>
          </div>
        </div>
        <ActivityCalendar
          days={DEMO_REPORT_DAYS.days}
          max={DEMO_REPORT_DAYS.max}
          label="Отчёты полигона по дням за год"
          formatCount={formatReports}
        />
      </section>
    </div>
  )
}
