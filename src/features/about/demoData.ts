import type { Role } from '@/features/auth/permissions'
import type { ReportStatusCode } from '@/features/reports/api'
import type { ChartPeriod, ChartPoint, ChartStep } from '@/shared/lib/chart'
import { addDays, fillDays, toDayString } from '@/shared/lib/dates'

// Выдуманные данные для демонстрации на странице «О системе»: к API страница не обращается

// Повторяемый генератор случайных чисел — демо выглядит одинаково при каждом открытии
function random(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const compact = (text: string) => text.replace(/\s+/g, '').toUpperCase()

// Поиск по госномеру без учёта пробелов и регистра: «а482», «А 482 КМ 50»
export const matchesPlate = (search: string, plate: string, region: string) =>
  compact(plate + region).includes(compact(search))

export type DemoReport = {
  id: number
  time: string
  plate: string
  region: string
  wasteType: string
  carrier: string
  nettoKg: number
  taraKg: number
  taraTime: string // когда взвесили пустую машину
  status: ReportStatusCode
}

export const DEMO_REPORTS: DemoReport[] = [
  {
    id: 1,
    time: '08:12',
    plate: 'А482КМ',
    region: '50',
    wasteType: 'ТКО',
    carrier: 'ЭкоТранс',
    nettoKg: 13260,
    taraKg: 11400,
    taraTime: '08:31',
    status: 'awaiting_review',
  },
  {
    id: 2,
    time: '08:37',
    plate: 'В915ОР',
    region: '150',
    wasteType: 'Строительные отходы',
    carrier: 'СтройВывоз',
    nettoKg: 17840,
    taraKg: 14250,
    taraTime: '09:02',
    status: 'awaiting_review',
  },
  {
    id: 3,
    time: '09:05',
    plate: 'Е307ТХ',
    region: '77',
    wasteType: 'ТКО',
    carrier: 'ЭкоТранс',
    nettoKg: 11920,
    taraKg: 11180,
    taraTime: '09:24',
    status: 'rejected',
  },
  {
    id: 4,
    time: '09:41',
    plate: 'К640МН',
    region: '50',
    wasteType: 'Крупногабаритные отходы',
    carrier: 'ГорЧистота',
    nettoKg: 8410,
    taraKg: 12060,
    taraTime: '10:03',
    status: 'awaiting_review',
  },
  {
    id: 5,
    time: '10:18',
    plate: 'М221АС',
    region: '190',
    wasteType: 'ТКО',
    carrier: 'ГорЧистота',
    nettoKg: 14530,
    taraKg: 11950,
    taraTime: '10:36',
    status: 'sent',
  },
]

export type DemoVehicle = {
  plate: string
  region: string
  make: string
  carrier: string
  monthReports: number
  monthNettoKg: number
}

// Машины полигона с отчётами и весом отходов за месяц; по ним же считаются доли перевозчиков
export const DEMO_VEHICLES: DemoVehicle[] = [
  {
    plate: 'А482КМ',
    region: '50',
    make: 'КамАЗ 65115',
    carrier: 'ЭкоТранс',
    monthReports: 58,
    monthNettoKg: 762400,
  },
  {
    plate: 'В915ОР',
    region: '150',
    make: 'МАЗ 6501',
    carrier: 'СтройВывоз',
    monthReports: 41,
    monthNettoKg: 712300,
  },
  {
    plate: 'Е307ТХ',
    region: '77',
    make: 'КамАЗ 43253',
    carrier: 'ЭкоТранс',
    monthReports: 63,
    monthNettoKg: 735100,
  },
  {
    plate: 'К640МН',
    region: '50',
    make: 'Scania P360',
    carrier: 'ГорЧистота',
    monthReports: 37,
    monthNettoKg: 318600,
  },
  {
    plate: 'М221АС',
    region: '190',
    make: 'Volvo FE',
    carrier: 'ГорЧистота',
    monthReports: 52,
    monthNettoKg: 741800,
  },
  {
    plate: 'Е734РУ',
    region: '750',
    make: 'КамАЗ 65115',
    carrier: 'ЭкоТранс',
    monthReports: 49,
    monthNettoKg: 644900,
  },
  {
    plate: 'О158ВЕ',
    region: '50',
    make: 'МАЗ 5550',
    carrier: 'ЧистыйГород',
    monthReports: 44,
    monthNettoKg: 562700,
  },
  {
    plate: 'Т903НА',
    region: '77',
    make: 'Scania G400',
    carrier: 'СтройВывоз',
    monthReports: 22,
    monthNettoKg: 401500,
  },
]

export type DemoCarrier = {
  name: string
  vehicles: number
  monthReports: number
  monthNettoKg: number
  sharePercent: number // доля в весе отходов полигона за месяц
}

const monthNettoKg = DEMO_VEHICLES.reduce((sum, v) => sum + v.monthNettoKg, 0)

export const DEMO_CARRIERS: DemoCarrier[] = [...new Set(DEMO_VEHICLES.map((v) => v.carrier))]
  .map((name) => {
    const own = DEMO_VEHICLES.filter((v) => v.carrier === name)
    const netto = own.reduce((sum, v) => sum + v.monthNettoKg, 0)
    return {
      name,
      vehicles: own.length,
      monthReports: own.reduce((sum, v) => sum + v.monthReports, 0),
      monthNettoKg: netto,
      sharePercent: (netto / monthNettoKg) * 100,
    }
  })
  .sort((a, b) => b.monthNettoKg - a.monthNettoKg)

export type DemoUser = { name: string; role: Role; about: string; status: string }

// По пользователю на роль полигона; описания шуточные, но права за ними настоящие
export const DEMO_USERS: DemoUser[] = [
  {
    name: 'Анна Смирнова',
    role: 'employee',
    about:
      'Встречает каждую машину на полигоне: фотографирует её на въезде и табло весов, а вес приложение распознаёт само. Постоянных перевозчиков узнаёт ещё до того, как машина встанет на платформу.',
    status: 'На смене с 8:00',
  },
  {
    name: 'Ольга Кузнецова',
    role: 'accountant',
    about:
      'Сверяет номер на фото, вес на табло и вид отходов быстрее, чем остывает кофе. Принятые отчёты уходят в ФГИС УТКО. Уговорить её принять отчёт «на глаз» пока не удалось ни одному перевозчику.',
    status: 'Проверила 37 отчётов',
  },
  {
    name: 'Сергей Волков',
    role: 'admin',
    about:
      'Смотрит на графики и знает, сколько тонн принял полигон, раньше, чем об этом спросят на совещании. Отчёты не проверяет, но может – на всякий случай.',
    status: 'Заходил 10 минут назад',
  },
]

// Груз и пустая машина в демо весовой
export const DEMO_WEIGHING = {
  plate: 'Е734РУ',
  region: '750',
  wasteType: 'ТКО',
  carrier: 'ЭкоТранс',
  bruttoKg: 24380,
  taraKg: 11120,
}

const today = new Date()

// Отчёты и вес отходов по дням за год, с понедельника год назад по сегодня. Весовая работает
// по сменам без выходных, поэтому день недели ни на что не влияет, а нагрузку задают затяжные
// подъёмы и спады, случайный разброс и редкие тихие и загруженные дни
function buildDays() {
  const next = random(2024)
  const monday = addDays(today, -364)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const phase = next() * Math.PI * 2
  return fillDays(toDayString(monday), toDayString(today), []).map(({ date }, i) => {
    const trend = 1 + 0.2 * Math.sin(i / 7 + phase) + 0.1 * Math.sin(i / 1.9)
    const r = next()
    const burst = r < 0.06 ? 0.45 : r > 0.95 ? 1.45 : 1
    const count = Math.max(1, Math.round(11.5 * trend * burst * (0.55 + next() * 0.9)))
    // Вес одной машины – от 11 до 16 т
    const tonnes = Math.round(count * (11 + next() * 5))
    return { date, count, tonnes }
  })
}

const DAYS = buildDays()
const TONNES = new Map(DAYS.map((d) => [d.date, d.tonnes]))

function buildSeries(period: ChartPeriod): ChartPoint[] {
  const sum = (from: Date, to: Date) => {
    let total = 0
    for (let d = from; d <= to; d = addDays(d, 1)) total += TONNES.get(toDayString(d)) ?? 0
    return total
  }
  const point = (from: Date, to: Date) => ({
    from: toDayString(from),
    to: toDayString(to),
    value: sum(from, to),
  })

  if (period === 'year') {
    return Array.from({ length: 12 }, (_, i) => {
      const from = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
      const end = new Date(from.getFullYear(), from.getMonth() + 1, 0)
      return point(from, end < today ? end : today)
    })
  }
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i - 6)
      return point(day, day)
    })
  }
  const days = period === 'month' ? 30 : 90
  const start = addDays(today, 1 - days)
  const points: ChartPoint[] = []
  for (let from = start; from <= today; from = addDays(from, 7)) {
    const to = addDays(from, 6)
    points.push(point(from, to < today ? to : today))
  }
  return points
}

export const DEMO_SERIES: Record<ChartPeriod, { step: ChartStep; points: ChartPoint[] }> = {
  week: { step: 'day', points: buildSeries('week') },
  month: { step: 'week', points: buildSeries('month') },
  quarter: { step: 'week', points: buildSeries('quarter') },
  year: { step: 'month', points: buildSeries('year') },
}

// Отчёты по дням для календаря, как у посещений машины
export const DEMO_REPORT_DAYS = {
  days: DAYS.map(({ date, count }) => ({ date, count })),
  max: Math.max(...DAYS.map((d) => d.count)),
}
