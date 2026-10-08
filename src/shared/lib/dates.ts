export type DateRange = { from: string; to: string }

const pad = (n: number) => String(n).padStart(2, '0')

export const toDayString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// Сегодняшний день в виде YYYY-MM-DD
export const todayString = () => toDayString(new Date())

export function fromDayString(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfMonth(day?: string) {
  const date = day ? fromDayString(day) : new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Границы суток в ISO для запроса к API
export const startOfDayIso = (day: string) => fromDayString(day).toISOString()

export function endOfDayIso(day: string) {
  const date = fromDayString(day)
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

const shortFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const fullFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDay(day: string) {
  const date = fromDayString(day)
  const format = date.getFullYear() === new Date().getFullYear() ? shortFormat : fullFormat
  return format.format(date)
}

export function formatRange({ from, to }: Partial<DateRange>) {
  if (from && to) return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`
  if (from) return `с ${formatDay(from)}`
  if (to) return `по ${formatDay(to)}`
  return ''
}

// Значение для <input type="datetime-local">: локальное время без секунд
export function toDateTimeLocal(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${toDayString(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Обратно в ISO (UTC) для API; пустое поле — null
export const fromDateTimeLocal = (value: string) => (value ? new Date(value).toISOString() : null)

// Каждый день от from до to (YYYY-MM-DD, включительно) со значением из days, остальные — с нулём
export function fillDays(from: string, to: string, days: { date: string; count: number }[]) {
  const counts = new Map(days.map((d) => [d.date, d.count]))
  const result: { date: string; count: number }[] = []
  for (let d = fromDayString(from); toDayString(d) <= to; d = addDays(d, 1)) {
    const date = toDayString(d)
    result.push({ date, count: counts.get(date) ?? 0 })
  }
  return result
}
