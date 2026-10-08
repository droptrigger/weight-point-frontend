import type { Landfill } from '@/features/landfills/api'
import type { User } from '@/features/users/api'
import { http, type ListParams, type Paged } from '@/shared/api/http'
import type { ChartPeriod, ChartPoint } from '@/shared/lib/chart'
import { fillDays } from '@/shared/lib/dates'

type Ref = { id: string; name: string }

export type Vehicle = {
  id: string
  plateNumber: string
  regionCode: string
  make: Ref | null
  carrier: Ref | null
  isActive: boolean
}

// Машина принадлежит одному полигону: справочник машин у каждого полигона свой
export type VehicleDetails = Vehicle & {
  imageUrl: string | null
  createdAt: string
  landfill: Landfill | null
  createdBy?: User | null
}

export type VehicleInput = {
  plateNumber: string
  regionCode: string
  makeId: string
  carrierId: string
  landfillId?: string // только при создании и только у разработчика
}

export type VehicleParams = ListParams & {
  landfillId?: string
  makeId?: string
  carrierId?: string
}

export type VehicleAnalytics = {
  vehicleId: string
  reportsCount: number
  totalNettoKg: number
  monthAverageNettoKg: number | null // null, если за месяц отчётов нет
}

// График нетто: from — первый день периода, to — сегодня, точки по дням, неделям или месяцам
export type VehicleNettoChart = {
  vehicleId: string
  from: string
  to: string
  totalNettoKg: number
  points: ChartPoint[]
}

// Календарь посещений за год: одно посещение — один отчёт. Сервер присылает в days только дни
// с посещениями, vehiclesApi.visits дополняет их нулями до каждого дня от from (понедельник) до to (сегодня)
export type VehicleVisits = {
  vehicleId: string
  from: string
  to: string
  totalVisits: number
  activeDays: number
  maxDayVisits: number
  days: VisitDay[]
}

export type VisitDay = { date: string; count: number }

export const vehiclesApi = {
  list: (p: VehicleParams) => http.get<Paged<Vehicle>>('/vehicles', p),
  get: (id: string) => http.get<VehicleDetails>(`/vehicles/${id}`),
  create: (d: VehicleInput) => http.post<VehicleDetails>('/vehicles', d),
  update: (id: string, d: VehicleInput) =>
    http.put<VehicleDetails>(`/vehicles/${id}`, { id, ...d }),
  remove: (id: string) => http.delete(`/vehicles/${id}`),
  restore: (id: string) => http.patch(`/vehicles/${id}/restore`),
  analytics: (id: string) => http.get<VehicleAnalytics>(`/vehicles/${id}/analytics`),
  nettoChart: (id: string, period: ChartPeriod) =>
    http.get<VehicleNettoChart>(`/vehicles/${id}/analytics/netto-chart`, { period }),
  visits: async (id: string): Promise<VehicleVisits> => {
    const res = await http.get<VehicleVisits>(`/vehicles/${id}/analytics/visits`)
    return { ...res, days: fillDays(res.from, res.to, res.days) }
  },
  uploadImage: (id: string, file: File) => {
    const body = new FormData()
    body.append('image', file)
    return http.patch<VehicleDetails>(`/vehicles/${id}/image`, body)
  },
}

export const plateLabel = (v: Pick<Vehicle, 'plateNumber' | 'regionCode'>) =>
  `${v.plateNumber} ${v.regionCode}`
