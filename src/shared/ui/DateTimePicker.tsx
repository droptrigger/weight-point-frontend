import { useRef, useState } from 'react'
import { CalendarClock, CalendarDays } from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { startOfMonth, toDateTimeLocal, todayString } from '@/shared/lib/dates'
import { useClickOutside } from '@/shared/lib/useClickOutside'
import { Button } from './Button'
import { CalendarMonth } from './CalendarMonth'

// Ручной ввод в виде ДД.ММ.ГГГГ ЧЧ:ММ (или только даты): разделители подставляются сами
type MaskGroup = [size: number, prefix: string]
const DATE_GROUPS: MaskGroup[] = [
  [2, ''],
  [2, '.'],
  [4, '.'],
]
const DATETIME_GROUPS: MaskGroup[] = [...DATE_GROUPS, [2, ' '], [2, ':']]

function maskInput(text: string, groups: MaskGroup[]) {
  const max = groups.reduce((sum, [size]) => sum + size, 0)
  const digits = text.replace(/\D/g, '').slice(0, max)
  let result = ''
  let pos = 0
  for (const [size, prefix] of groups) {
    if (pos >= digits.length) break
    result += prefix + digits.slice(pos, pos + size)
    pos += size
  }
  return result
}

// YYYY-MM-DD[THH:mm] → ДД.ММ.ГГГГ[ ЧЧ:ММ]
function toInputText(value: string) {
  if (!value) return ''
  const [day, time] = value.split('T')
  const [y, m, d] = day.split('-')
  return time ? `${d}.${m}.${y} ${time}` : `${d}.${m}.${y}`
}

// ДД.ММ.ГГГГ[ ЧЧ:ММ] → YYYY-MM-DD[THH:mm]; несуществующие дата и время — undefined
function fromInputText(text: string, withTime: boolean) {
  const match = withTime
    ? /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(text)
    : /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text)
  if (!match) return undefined
  const [, d, m, y, hh = '00', mm = '00'] = match
  const date = new Date(+y, +m - 1, +d, +hh, +mm)
  const valid =
    date.getFullYear() === +y &&
    date.getMonth() === +m - 1 &&
    date.getDate() === +d &&
    +hh < 24 &&
    +mm < 60
  if (!valid) return undefined
  return withTime ? `${y}-${m}-${d}T${hh}:${mm}` : `${y}-${m}-${d}`
}

// Примерная высота календаря: если снизу места меньше, он открывается вверх
const POPOVER_HEIGHT = 470

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const now = () => toDateTimeLocal(new Date().toISOString())

type Props = {
  id: string
  value: string // YYYY-MM-DDTHH:mm (у DatePicker — YYYY-MM-DD), пусто — не задано
  onChange: (value: string) => void
  invalid?: boolean
  placeholder?: string
}

type PickerProps = Props & {
  withTime: boolean
  future: boolean // можно ли выбрать дату позже сегодняшней
}

// Дата и время одним полем: календарь как у фильтра периода, справа колонки часов и минут.
// Будущее время недоступно: взвешиваний из будущего не бывает
export function DateTimePicker(props: Props) {
  return <Picker withTime future={false} placeholder="дд.мм.гггг чч:мм" {...props} />
}

// Только дата, в том числе будущая (например, срок действия лицензии)
export function DatePicker(props: Props) {
  return <Picker withTime={false} future placeholder="дд.мм.гггг" {...props} />
}

function Picker({ id, value, onChange, invalid, placeholder, withTime, future }: PickerProps) {
  const [day = '', time = ''] = value ? value.split('T') : []
  // Текст во время ручного ввода; null — в поле текущее значение
  const [draft, setDraft] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const [view, setView] = useState(() => startOfMonth(day || undefined))
  const root = useRef<HTMLDivElement>(null)

  const today = todayString()
  const groups = withTime ? DATETIME_GROUPS : DATE_GROUPS

  const close = () => setOpen(false)

  const toggle = () => {
    if (open) return close()
    const rect = root.current?.getBoundingClientRect()
    setUp(
      Boolean(
        rect && window.innerHeight - rect.bottom < POPOVER_HEIGHT && rect.top > POPOVER_HEIGHT,
      ),
    )
    setView(startOfMonth(day || undefined)) // открывается на месяце выбранной даты
    setOpen(true)
  }

  const [hour = '', minute = ''] = time ? time.split(':') : []

  const text = draft ?? toInputText(value)
  // Недописанная или несуществующая дата подсвечивается, в форму уходит прежнее значение
  const draftInvalid =
    draft !== null && draft !== '' && fromInputText(draft, withTime) === undefined

  const type = (input: string) => {
    const next = maskInput(input, groups)
    setDraft(next)
    if (!next) return onChange('')
    const parsed = fromInputText(next, withTime)
    if (parsed) onChange(parsed)
  }

  // Без выбранного времени подставляется текущее — его легко поправить справа.
  // Без времени выбор дня и есть весь выбор, поэтому календарь закрывается
  const pickDay = (next: string) => {
    if (!withTime) {
      onChange(next)
      return close()
    }
    onChange(`${next}T${time || now().slice(11)}`)
  }
  // Без выбранного дня время относится к сегодняшнему
  const pickHour = (next: string) => onChange(`${day || today}T${next}:${minute || '00'}`)
  const pickMinute = (next: string) =>
    onChange(`${day || today}T${hour || now().slice(11, 13)}:${next}`)

  useClickOutside(root, open, close)

  return (
    <div
      ref={root}
      className={cx('dropdown datepicker', open && 'open', (invalid || draftInvalid) && 'invalid')}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.preventDefault()
          e.stopPropagation() // чтобы модалка не закрылась вместе с календарём
          close()
        }
      }}
    >
      <div className="dropdown-toggle datetime-toggle">
        <input
          id={id}
          className="datetime-input"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          aria-invalid={invalid || draftInvalid || undefined}
          onFocus={() => setDraft(toInputText(value))}
          onBlur={() => setDraft(null)}
          onChange={(e) => type(e.target.value)}
        />
        <button
          type="button"
          className="datetime-open"
          aria-label="Открыть календарь"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
        >
          {withTime ? (
            <CalendarClock className="icon dropdown-icon" />
          ) : (
            <CalendarDays className="icon dropdown-icon" />
          )}
        </button>
      </div>

      {open && (
        <div
          className={cx('datepicker-popover', up && 'is-up')}
          role="dialog"
          aria-label={withTime ? 'Выбор даты и времени' : 'Выбор даты'}
        >
          <div className="datetime-body">
            <div className="datetime-calendar">
              <CalendarMonth
                view={view}
                onView={setView}
                allowFuture={future}
                isSelected={(d) => d === day}
                dayClass={(d) => cx(d === day && 'is-start is-end')}
                onPick={pickDay}
              />
            </div>
            {withTime && (
              <>
                <TimeColumn title="Часы" items={HOURS} selected={hour} onPick={pickHour} />
                <TimeColumn title="Мин" items={MINUTES} selected={minute} onPick={pickMinute} />
              </>
            )}
          </div>

          <div className="datepicker-foot">
            <button
              type="button"
              className="preset datetime-now"
              onClick={() => {
                onChange(withTime ? now() : today)
                close()
              }}
            >
              {withTime ? 'Сейчас' : 'Сегодня'}
            </button>
            <div className="datetime-actions">
              {value && (
                <button type="button" className="reset" onClick={() => onChange('')}>
                  Очистить
                </button>
              )}
              <Button className="btn--sm" onClick={close}>
                Готово
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type TimeColumnProps = {
  title: string
  items: string[]
  selected: string
  onPick: (value: string) => void
}

// Выбранное значение прокручивается в середину колонки
function centerInList(el: HTMLButtonElement | null) {
  const list = el?.parentElement
  if (el && list) list.scrollTop = el.offsetTop - (list.clientHeight - el.offsetHeight) / 2
}

function TimeColumn({ title, items, selected, onPick }: TimeColumnProps) {
  return (
    <div className="time-col">
      <span className="time-col-title">{title}</span>
      <div className="time-list" role="listbox" aria-label={title}>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={item === selected}
            className={cx('time-item', item === selected && 'selected')}
            ref={item === selected ? centerInList : undefined}
            onClick={() => onPick(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
