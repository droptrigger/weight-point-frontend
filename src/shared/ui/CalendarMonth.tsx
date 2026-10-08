import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTH_TITLE, monthCells, WEEKDAYS } from '@/shared/lib/calendar'
import { cx } from '@/shared/lib/cx'
import { fromDayString, startOfMonth, todayString } from '@/shared/lib/dates'

type Props = {
  view: Date // первое число показанного месяца
  onView: (view: Date) => void
  allowFuture?: boolean // без этого дни позже сегодняшнего недоступны и дальше текущего месяца не листается
  isSelected: (day: string) => boolean
  dayClass?: (day: string) => string // классы выбранного периода: is-start, in-range…
  onPick: (day: string) => void
  onHover?: (day: string | null) => void // день под курсором, null — курсор ушёл с сетки
}

// Месяц календаря с листанием и сеткой дней с понедельника: общий для DateRangePicker и DateTimePicker
export function CalendarMonth({
  view,
  onView,
  allowFuture = false,
  isSelected,
  dayClass,
  onPick,
  onHover,
}: Props) {
  const today = todayString()
  const isLastMonth = !allowFuture && view.getTime() >= startOfMonth().getTime()

  const shift = (delta: number) => onView(new Date(view.getFullYear(), view.getMonth() + delta, 1))

  return (
    <>
      <div className="datepicker-head">
        <button
          type="button"
          className="datepicker-nav"
          aria-label="Предыдущий месяц"
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="icon" />
        </button>
        <span className="datepicker-title">{MONTH_TITLE.format(view)}</span>
        <button
          type="button"
          className="datepicker-nav"
          aria-label="Следующий месяц"
          disabled={isLastMonth}
          onClick={() => shift(1)}
        >
          <ChevronRight className="icon" />
        </button>
      </div>

      <div className="datepicker-grid" onMouseLeave={onHover && (() => onHover(null))}>
        {WEEKDAYS.map((weekday, i) => (
          <span key={weekday} className={cx('datepicker-weekday', i >= 5 && 'is-weekend')}>
            {weekday}
          </span>
        ))}

        {monthCells(view).map((day, index) =>
          day ? (
            <button
              key={day}
              type="button"
              className={cx('day', dayClass?.(day), day === today && 'is-today')}
              disabled={!allowFuture && day > today}
              aria-pressed={isSelected(day)}
              onClick={() => onPick(day)}
              onMouseEnter={onHover && (() => onHover(day))}
            >
              <span>{fromDayString(day).getDate()}</span>
            </button>
          ) : (
            <span key={`empty-${index}`} />
          ),
        )}
      </div>
    </>
  )
}
