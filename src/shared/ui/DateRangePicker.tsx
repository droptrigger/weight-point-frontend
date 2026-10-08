import { useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { addDays, formatRange, startOfMonth, toDayString, type DateRange } from '@/shared/lib/dates'
import { useClickOutside } from '@/shared/lib/useClickOutside'
import { CalendarMonth } from './CalendarMonth'

const dayOf = (offset: number) => toDayString(addDays(new Date(), offset))

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Сегодня', range: () => ({ from: dayOf(0), to: dayOf(0) }) },
  { label: 'Вчера', range: () => ({ from: dayOf(-1), to: dayOf(-1) }) },
  { label: '7 дней', range: () => ({ from: dayOf(-6), to: dayOf(0) }) },
  { label: '30 дней', range: () => ({ from: dayOf(-29), to: dayOf(0) }) },
  { label: 'Этот месяц', range: () => ({ from: toDayString(startOfMonth()), to: dayOf(0) }) },
]

const sorted = (a: string, b: string): DateRange =>
  a <= b ? { from: a, to: b } : { from: b, to: a }

type Props = DateRange & {
  onChange: (range: DateRange) => void
  placeholder?: string
}

export function DateRangePicker({ from, to, onChange, placeholder = 'За всё время' }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => startOfMonth(to || from))
  const [anchor, setAnchor] = useState<string | null>(null) // первый клик выбора
  const [hover, setHover] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)

  const isSet = Boolean(from || to)
  // Пока выбирается конец периода, диапазон подсвечивается до курсора
  const range = anchor ? sorted(anchor, hover ?? anchor) : { from, to }

  const close = () => {
    setOpen(false)
    setAnchor(null)
    setHover(null)
  }

  const toggle = () => {
    if (open) return close()
    setView(startOfMonth(to || from)) // открывается на месяце выбранного периода
    setOpen(true)
  }

  const apply = (next: DateRange) => {
    onChange(next)
    close()
  }

  const pickDay = (day: string) => {
    if (!anchor) return setAnchor(day)
    apply(sorted(anchor, day))
  }

  useClickOutside(root, open, close)

  const hasRange = Boolean(range.from && range.to && range.from !== range.to)
  const isEdge = (day: string) => day === range.from || day === range.to
  const dayClass = (day: string) =>
    cx(
      day === range.from && 'is-start',
      day === range.to && 'is-end',
      hasRange && isEdge(day) && 'in-band',
      range.from && range.to && day > range.from && day < range.to && 'in-range',
    )

  return (
    <div
      ref={root}
      className={cx('dropdown datepicker', open && 'open', isSet && 'is-set')}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.preventDefault()
          close()
        }
      }}
    >
      <button
        type="button"
        className="dropdown-toggle"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="dropdown-label">{formatRange({ from, to }) || placeholder}</span>
        <CalendarDays className="icon dropdown-icon" />
      </button>

      {open && (
        <div className="datepicker-popover" role="dialog" aria-label="Выбор периода">
          <div className="datepicker-presets">
            {PRESETS.map((preset) => {
              const r = preset.range()
              const active = r.from === from && r.to === to
              return (
                <button
                  key={preset.label}
                  type="button"
                  className={cx('preset', active && 'active')}
                  aria-pressed={active}
                  onClick={() => apply(r)}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Отчётов из будущего не бывает: дни после сегодняшнего недоступны */}
          <CalendarMonth
            view={view}
            onView={setView}
            isSelected={isEdge}
            dayClass={dayClass}
            onPick={pickDay}
            onHover={(day) => setHover(anchor ? day : null)}
          />

          <div className="datepicker-foot">
            <span className={cx('datepicker-hint', anchor && 'is-picking')}>
              {anchor ? 'Выберите конец периода' : formatRange({ from, to }) || placeholder}
            </span>
            {isSet && (
              <button type="button" className="reset" onClick={() => apply({ from: '', to: '' })}>
                Сбросить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
