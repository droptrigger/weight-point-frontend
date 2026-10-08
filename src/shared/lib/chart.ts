import { fromDayString } from './dates'

// Период линейного графика на сервере: week — по дням за 7 дней, month и quarter — по неделям
// за 30 и 90 дней, year — по месяцам за 12 месяцев
export type ChartPeriod = 'week' | 'month' | 'quarter' | 'year'

export const CHART_PERIODS: { value: ChartPeriod; label: string; caption: string }[] = [
  { value: 'week', label: 'Неделя', caption: 'за неделю' },
  { value: 'month', label: '30 дней', caption: 'за 30 дней' },
  { value: 'quarter', label: '90 дней', caption: 'за 90 дней' },
  { value: 'year', label: 'Год', caption: 'за год' },
]

// Подпись периода в тексте: «за 30 дней»
export const periodCaption = (period: ChartPeriod) =>
  CHART_PERIODS.find((p) => p.value === period)?.caption ?? ''

// Точка графика: значение за интервал from–to (обе даты включительно, YYYY-MM-DD)
export type ChartPoint = { from: string; to: string; value: number }

// Шаг точек графика — от него зависят подписи оси и подсказки
export type ChartStep = 'day' | 'week' | 'month'

export const PERIOD_STEP: Record<ChartPeriod, ChartStep> = {
  week: 'day',
  month: 'week',
  quarter: 'week',
  year: 'month',
}

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const weekdayDayMonth = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
})
const monthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' })
const monthYear = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

// Подпись точки на оси X: день, начало недели или месяц
export function axisLabel(point: ChartPoint, step: ChartStep) {
  const from = fromDayString(point.from)
  return step === 'month' ? monthShort.format(from) : dayMonth.format(from)
}

// Заголовок подсказки: полный интервал точки. Крайние недели и текущий месяц бывают неполными,
// поэтому границы берутся из точки, а не вычисляются
export function intervalLabel(point: ChartPoint, step: ChartStep) {
  const from = fromDayString(point.from)
  if (step === 'day') return weekdayDayMonth.format(from)
  if (step === 'month') {
    const text = monthYear.format(from).replace(' г.', '')
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  return point.from === point.to
    ? dayMonth.format(from)
    : `${dayMonth.format(from)} – ${dayMonth.format(fromDayString(point.to))}`
}

// Круглый шаг делений оси: 1, 2, 2.5 или 5, умноженные на степень десяти
function niceStep(raw: number) {
  const power = 10 ** Math.floor(Math.log10(raw))
  const fraction = raw / power
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * power
}

// Деления оси Y от нуля: верхнее не меньше максимума. Без данных — шкала до 1 000
export function yTicks(max: number, count = 4) {
  const step = max > 0 ? niceStep(max / count) : 250
  const top = max > 0 ? Math.ceil(max / step) * step : step * count
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
}
