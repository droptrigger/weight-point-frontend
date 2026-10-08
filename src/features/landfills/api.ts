import type { User } from '@/features/users/api'
import type { Vehicle } from '@/features/vehicles/api'
import { http, type ListParams, type Paged } from '@/shared/api/http'
import type { ChartPeriod, ChartPoint } from '@/shared/lib/chart'
import { fillDays } from '@/shared/lib/dates'

export type Landfill = {
  id: string
  name: string
  latitude: number
  longitude: number
  isActive: boolean
}
export type LandfillDetails = Landfill & {
  createdAt: string
  vehicles: Vehicle[]
  employees: User[] | null // null — у текущей роли нет права видеть пользователей
}
export type LandfillInput = { name: string; latitude: number; longitude: number }

// Сводка за год: с первого числа месяца 11 месяцев назад (from) по сегодня (to), как годовой график
export type LandfillAnalytics = {
  landfillId: string
  from: string
  to: string
  reportsCount: number
  totalNettoKg: number
  averageNettoKg: number | null
}

export type LandfillNettoChart = {
  landfillId: string
  from: string
  to: string
  totalNettoKg: number
  points: ChartPoint[]
}

// Календарь отчётов за год, как у посещений машины: сервер присылает только дни с отчётами,
// landfillsApi.reportsCalendar дополняет их нулями до каждого дня от from (понедельник) до to
export type LandfillReportsCalendar = {
  landfillId: string
  from: string
  to: string
  totalReports: number
  activeDays: number
  maxDayReports: number
  days: { date: string; count: number }[]
}

export const landfillsApi = {
  list: (p: ListParams) => http.get<Paged<Landfill>>('/landfill', p),
  get: (id: string) => http.get<LandfillDetails>(`/landfill/${id}`),
  create: (d: LandfillInput) => http.post<Landfill>('/landfill', d),
  update: (id: string, d: LandfillInput) =>
    http.put<LandfillDetails>(`/landfill/${id}`, { id, ...d }),
  remove: (id: string) => http.delete(`/landfill/${id}`),
  restore: (id: string) => http.patch(`/landfill/${id}/restore`),
  analytics: (id: string) => http.get<LandfillAnalytics>(`/landfill/${id}/analytics`),
  nettoChart: (id: string, period: ChartPeriod) =>
    http.get<LandfillNettoChart>(`/landfill/${id}/analytics/netto-chart`, { period }),
  reportsCalendar: async (id: string): Promise<LandfillReportsCalendar> => {
    const res = await http.get<LandfillReportsCalendar>(
      `/landfill/${id}/analytics/reports-calendar`,
    )
    return { ...res, days: fillDays(res.from, res.to, res.days) }
  },
}

type Coords = Pick<Landfill, 'latitude' | 'longitude'>

// 0, 0 сервер отдаёт, когда координаты не заполнены
export const hasCoords = (c: Coords) => Boolean(c.latitude || c.longitude)
export const coordsLabel = (c: Coords) =>
  hasCoords(c) ? `${c.latitude}, ${c.longitude}` : 'Не указаны'
export const mapUrl = (c: Coords) =>
  `https://yandex.ru/maps/?pt=${c.longitude},${c.latitude}&z=15&l=map`
