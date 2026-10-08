import { useState } from 'react'
import { PERIOD_STEP, periodCaption, type ChartPeriod } from '@/shared/lib/chart'
import { cx } from '@/shared/lib/cx'
import { formatKgRounded } from '@/shared/lib/format'
import { LineChart } from '@/shared/ui/LineChart'
import { PeriodSwitch } from '@/shared/ui/PeriodSwitch'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useLandfillNettoChart } from './hooks'

const HEIGHT = 240

// Линейный график веса отходов (нетто), принятых полигоном, с выбором периода.
// enabled = false — заглушка, пока полигон не выбран
type Props = { landfillId: string; enabled?: boolean }

export function LandfillNettoChart({ landfillId, enabled = true }: Props) {
  const [period, setPeriod] = useState<ChartPeriod>('month')
  const { data, isPending, isError, isPlaceholderData } = useLandfillNettoChart(
    landfillId,
    period,
    enabled,
  )

  return (
    <section
      className="info-card chart-card"
      aria-busy={isPending || isPlaceholderData || undefined}
    >
      <div className="chart-head">
        <div>
          <h2 className="chart-title">Вес отходов</h2>
          <div className="chart-total">
            {isPending ? (
              <Skeleton width={140} />
            ) : (
              data && (
                <>
                  <strong>{formatKgRounded(data.totalNettoKg)}</strong> {periodCaption(data.period)}
                </>
              )
            )}
          </div>
        </div>
        <PeriodSwitch value={period} onChange={setPeriod} />
      </div>

      {isError ? (
        <div className="state state-compact">Не удалось загрузить график</div>
      ) : isPending ? (
        <Skeleton variant="block" height={HEIGHT} />
      ) : (
        <div className={cx('chart-body', isPlaceholderData && 'is-stale')}>
          <LineChart
            points={data.points}
            step={PERIOD_STEP[data.period]}
            label={`Вес отходов ${periodCaption(data.period)}`}
            formatValue={formatKgRounded}
            height={HEIGHT}
          />
          {data.totalNettoKg === 0 && <div className="chart-empty">Нет отчётов за период</div>}
        </div>
      )}
    </section>
  )
}
