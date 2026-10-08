import { toDayString } from './dates'

// Общее для календарей DateRangePicker и DateTimePicker

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const MONTH_TITLE = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

// Ячейки месяца: пустые до первого дня (неделя с понедельника), затем все дни
export function monthCells(view: Date): (string | null)[] {
  const year = view.getFullYear()
  const month = view.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDayString(new Date(year, month, i + 1))),
  ]
}
