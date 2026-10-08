import { CHART_PERIODS, type ChartPeriod } from '@/shared/lib/chart'
import { cx } from '@/shared/lib/cx'

type Props = { value: ChartPeriod; onChange: (period: ChartPeriod) => void }

// Кнопки периода над линейным графиком
export function PeriodSwitch({ value, onChange }: Props) {
  return (
    <div className="chart-periods" role="group" aria-label="Период графика">
      {CHART_PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={cx('preset', p.value === value && 'active')}
          aria-pressed={p.value === value}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
