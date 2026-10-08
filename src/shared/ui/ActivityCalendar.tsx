import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { cx } from '@/shared/lib/cx'
import { fromDayString } from '@/shared/lib/dates'
import { clamp } from '@/shared/lib/math'

type Day = { date: string; count: number }

type Props = {
  days: Day[] // каждый день по порядку, первый — понедельник
  max: number // наибольшее значение за день — верх шкалы цвета
  label: string // что считается — для экранного диктора
  formatCount: (count: number) => string // «3 посещения», «Нет посещений»
  onSelect?: (date: string) => void // нажатие на день со значением (пустые дни не нажимаются)
}

const LEVELS = 4
const WEEKDAYS = ['Пн', '', 'Ср', '', 'Пт', '', '']

const monthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' })
const fullDate = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// Насыщенность ячейки: 0 — пусто, дальше доля от максимума, разбитая на равные ступени
const levelOf = (count: number, max: number) =>
  count > 0 && max > 0 ? Math.min(LEVELS, Math.ceil((count / max) * LEVELS)) : 0

// Подписи месяцев над столбцами-неделями, в которых начинается месяц. Первый столбец
// подписывается, только если следующая подпись не налезет на него
function monthLabels(days: Day[]) {
  const labels: { column: number; text: string }[] = []
  for (let i = 0; i < days.length; i++) {
    if (days[i].date.endsWith('-01')) {
      labels.push({
        column: Math.floor(i / 7),
        text: monthShort.format(fromDayString(days[i].date)),
      })
    }
  }
  if (days.length && (labels[0]?.column ?? Infinity) > 2) {
    labels.unshift({ column: 0, text: monthShort.format(fromDayString(days[0].date)) })
  }
  return labels
}

// Календарь активности по дням, как на GitHub: столбец — неделя (пн–вс), цвет — значение за день.
// Подсказка по наведению; с клавиатуры стрелки переходят по дням и неделям, Enter выбирает день
export function ActivityCalendar({ days, max, label, formatCount, onSelect }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<{ index: number; x: number; y: number } | null>(null)
  const columns = Math.ceil(days.length / 7)

  const show = (index: number, scroll = false) => {
    const cell = root.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    const box = root.current?.getBoundingClientRect()
    if (!cell || !box) return
    if (scroll) cell.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const r = cell.getBoundingClientRect()
    setActive({ index, x: r.left - box.left + r.width / 2, y: r.top - box.top })
  }

  const onPointerOver = (e: PointerEvent<HTMLDivElement>) => {
    const index = (e.target as HTMLElement).dataset.index
    if (index !== undefined) show(Number(index))
  }

  const isSelectable = (index: number) => Boolean(onSelect && days[index]?.count)

  const select = (index: number) => {
    if (isSelectable(index)) onSelect?.(days[index].date)
  }

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const index = (e.target as HTMLElement).dataset.index
    if (index !== undefined) select(Number(index))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && active) {
      e.preventDefault()
      select(active.index)
      return
    }
    const shift = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[e.key]
    if (e.key === 'Escape') setActive(null)
    if (!shift || !days.length) return
    e.preventDefault()
    const from = active?.index ?? days.length
    show(clamp(from + shift, 0, days.length - 1), true)
  }

  const current = active && days[active.index]
  const tipAlign =
    active === null
      ? 'center'
      : active.index / 7 < 4
        ? 'start'
        : active.index / 7 > columns - 5
          ? 'end'
          : 'center'

  return (
    <div className="activity" ref={root}>
      <div className="activity-scroll" onScroll={() => setActive(null)}>
        <div className="activity-body" style={{ '--weeks': columns } as CSSProperties}>
          <div className="activity-months" aria-hidden="true">
            {monthLabels(days).map((m) => (
              <span key={m.column} style={{ gridColumn: m.column + 1 }}>
                {m.text}
              </span>
            ))}
          </div>
          <div className="activity-weekdays" aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div
            className="activity-grid"
            tabIndex={days.length ? 0 : undefined}
            role="group"
            aria-label={`${label}. Стрелки — переход по дням${onSelect ? ', Enter — открыть день' : ''}`}
            onPointerOver={onPointerOver}
            onClick={onClick}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
          >
            {days.map((d, i) => (
              <span
                key={d.date}
                className={cx(
                  'activity-cell',
                  active?.index === i && 'is-active',
                  isSelectable(i) && 'is-selectable',
                )}
                data-index={i}
                data-level={levelOf(d.count, max)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="activity-legend" aria-hidden="true">
        Меньше
        {Array.from({ length: LEVELS + 1 }, (_, level) => (
          <span key={level} className="activity-cell" data-level={level} />
        ))}
        Больше
      </div>

      {current && active && (
        <div
          className={cx('line-chart-tip', `is-${tipAlign}`)}
          style={{ left: active.x, top: active.y + 4 }}
        >
          <span className="tooltip-title">{formatCount(current.count)}</span>
          <span className="tooltip-text">{fullDate.format(fromDayString(current.date))}</span>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {current &&
          `${fullDate.format(fromDayString(current.date))}: ${formatCount(current.count)}`}
      </div>
    </div>
  )
}
