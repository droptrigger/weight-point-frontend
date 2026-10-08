const date = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' })
const dateTime = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' })

export const formatDate = (v?: string | null) => (v ? date.format(new Date(v)) : '—')
export const formatDateTime = (v?: string | null) => (v ? dateTime.format(new Date(v)) : '—')

const short = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const numbers = new Intl.NumberFormat('ru-RU')

export const formatNumber = (v: number) => numbers.format(v)

export const formatShort = (v?: string | null) => (v ? short.format(new Date(v)) : '—')
export const formatKg = (v?: number | null) => (v == null ? '—' : `${numbers.format(v)} кг`)

// Средние вес сервер отдаёт с дробной частью, на карточках достаточно целых килограммов
export const formatKgRounded = (v?: number | null) => formatKg(v == null ? v : Math.round(v))

const percents = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })

// Доля в процентах: сервер отдаёт до сотых, на диаграмме хватает одного знака
export const formatPercent = (v?: number | null) => (v == null ? '—' : `${percents.format(v)} %`)

const pluralRules = new Intl.PluralRules('ru-RU')

// Число со словом в нужной форме: forms — для 1, 2 и 5 («посещение», «посещения», «посещений»)
export function plural(n: number, forms: [one: string, few: string, many: string]) {
  const rule = pluralRules.select(n)
  const word = rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2]
  return `${numbers.format(n)} ${word}`
}
