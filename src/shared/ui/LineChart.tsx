import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  axisLabel,
  intervalLabel,
  yTicks,
  type ChartPoint,
  type ChartStep,
} from '@/shared/lib/chart'
import { cx } from '@/shared/lib/cx'
import { formatNumber } from '@/shared/lib/format'
import { clamp } from '@/shared/lib/math'
import { useElementWidth } from '@/shared/lib/useElementWidth'

type Props = {
  points: ChartPoint[]
  step: ChartStep
  label: string // что показывает линия — для экранного диктора и заголовка таблицы
  formatValue: (value: number) => string
  height?: number
}

const PAD_TOP = 16
const PAD_RIGHT = 28 // подпись последней точки центрирована по ней и не должна обрезаться
const PAD_BOTTOM = 30
const LABEL_GAP = 12 // от подписей оси Y до области графика
const CHAR_WIDTH = 7.5 // примерная ширина цифры при 12px — для отступа под подписи оси Y
const MIN_LABEL_SPACING = 64 // меньше — подписи оси X налезают друг на друга

// Линейный график одного ряда: линия с заливкой, деления оси Y от нуля, перекрестие
// и подсказка при наведении. Стрелки клавиатуры переключают точку, значения дублируются
// в скрытой таблице для экранного диктора
export function LineChart({ points, step, label, formatValue, height = 240 }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const ticks = yTicks(Math.max(0, ...points.map((p) => p.value)))
  const top = ticks[ticks.length - 1]
  const left = Math.max(...ticks.map((t) => formatNumber(t).length)) * CHAR_WIDTH + LABEL_GAP
  const plotWidth = Math.max(width - left - PAD_RIGHT, 0)
  const plotHeight = height - PAD_TOP - PAD_BOTTOM
  const n = points.length
  const dx = n > 1 ? plotWidth / (n - 1) : 0

  const xAt = (i: number) => left + (n > 1 ? i * dx : plotWidth / 2)
  const yAt = (v: number) => PAD_TOP + plotHeight - (v / top) * plotHeight
  const baseline = yAt(0)

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i)},${yAt(p.value)}`).join(' ')
  const area = n ? `${line} L${xAt(n - 1)},${baseline} L${xAt(0)},${baseline} Z` : ''

  // Подписи оси X прореживаются от последней точки, чтобы текущий период был подписан всегда
  const labelEvery = Math.max(
    Math.ceil(n / Math.max(Math.floor(plotWidth / MIN_LABEL_SPACING), 1)),
    1,
  )

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!n) return
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = n > 1 ? Math.round((x - left) / dx) : 0
    setActive(clamp(i, 0, n - 1))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return
    const shift = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (e.key === 'Escape') setActive(null)
    if (e.key === 'Home') setActive(0)
    if (e.key === 'End') setActive(n - 1)
    if (shift) setActive((i) => clamp((i ?? (shift > 0 ? -1 : n)) + shift, 0, n - 1))
    if (shift || e.key === 'Home' || e.key === 'End') e.preventDefault()
  }

  const current = active === null ? null : points[active]
  const tipX = active === null ? 0 : xAt(active)
  const tipY = current ? yAt(current.value) : 0
  // Подсказка над точкой, у краёв графика — со сдвигом внутрь, у верхнего края — под точкой
  const tipAlign =
    tipX < left + plotWidth * 0.2 ? 'start' : tipX > left + plotWidth * 0.8 ? 'end' : 'center'
  const tipBelow = tipY - PAD_TOP < 56

  return (
    <div
      ref={ref}
      className="line-chart"
      style={{ height }}
      tabIndex={n ? 0 : undefined}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          aria-hidden="true"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                className="line-chart-grid"
                x1={left}
                x2={left + plotWidth}
                y1={yAt(t)}
                y2={yAt(t)}
              />
              <text
                className="line-chart-tick"
                x={left - LABEL_GAP}
                y={yAt(t)}
                textAnchor="end"
                dy="0.32em"
              >
                {formatNumber(t)}
              </text>
            </g>
          ))}

          {points.map(
            (p, i) =>
              (n - 1 - i) % labelEvery === 0 && (
                <text
                  key={p.from}
                  className="line-chart-tick"
                  x={xAt(i)}
                  y={height - PAD_BOTTOM + 18}
                  textAnchor="middle"
                >
                  {axisLabel(p, step)}
                </text>
              ),
          )}

          <path className="line-chart-area" d={area} />
          {active !== null && (
            <line className="line-chart-cross" x1={tipX} x2={tipX} y1={PAD_TOP} y2={baseline} />
          )}
          <path className="line-chart-line" d={line} />

          {points.map((p, i) => (
            <circle
              key={p.from}
              className={cx('line-chart-dot', i === active && 'is-active')}
              cx={xAt(i)}
              cy={yAt(p.value)}
              r={i === active ? 6 : 4}
            />
          ))}
        </svg>
      )}

      {current && (
        <div
          className={cx('line-chart-tip', `is-${tipAlign}`, tipBelow && 'is-below')}
          style={{ left: tipX, top: tipY }}
        >
          <span className="tooltip-title">{intervalLabel(current, step)}</span>
          <span className="tooltip-text">{formatValue(current.value)}</span>
        </div>
      )}

      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.from}>
              <th scope="row">{intervalLabel(p, step)}</th>
              <td>{formatValue(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
