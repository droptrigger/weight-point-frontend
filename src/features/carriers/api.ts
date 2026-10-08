import type { Vehicle } from '@/features/vehicles/api'
import { http, type ListParams, type Paged } from '@/shared/api/http'

export type Carrier = { id: string; name: string; isActive: boolean }
export type CarrierDetails = Carrier & {
  landfillId: string
  dateCreate: string
  vehicles: Vehicle[]
}
// landfillId учитывается только у разработчика: справочник у каждого полигона свой
export type CarrierParams = ListParams & { landfillId?: string }

export type CarrierAnalytics = {
  carrierId: string
  totalNettoKg: number
  monthAverageNettoKg: number | null // null, если за месяц отчётов нет
  sharePercent: number // доля в объёме выгрузок полигона
}

export const carriersApi = {
  list: (p: CarrierParams) => http.get<Paged<Carrier>>('/carrier', p),
  get: (id: string) => http.get<CarrierDetails>(`/carrier/${id}`),
  create: (name: string, landfillId?: string) =>
    http.post<CarrierDetails>('/carrier', { name, landfillId }),
  // В теле голая JSON-строка, а не объект: так устроен API
  update: (id: string, name: string) => http.put<CarrierDetails>(`/carrier/${id}`, name),
  remove: (id: string) => http.delete(`/carrier/${id}`),
  restore: (id: string) => http.patch(`/carrier/${id}/restore`),
  analytics: (id: string) => http.get<CarrierAnalytics>(`/carrier/${id}/analytics`),
}
