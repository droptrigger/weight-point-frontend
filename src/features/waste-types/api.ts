import { http, type ListParams, type Paged } from '@/shared/api/http'

export type WasteType = {
  id: string
  name: string
  code: string
  requiresSending: boolean // отчёты с этим видом отхода отправляются в ФГИС УТКО
  validUntil: string | null // окончание лицензии, дата без времени: YYYY-MM-DD; null — бессрочно
  isActive: boolean
}
export type WasteTypeDetails = WasteType & {
  landfillId: string
  licenseNumber: string | null
  createdAt: string
}
export type WasteTypeInput = {
  code: string
  name: string
  requiresSending: boolean
  licenseNumber: string | null
  validUntil: string | null
  landfillId?: string // только при создании и только у разработчика
}
// landfillId учитывается только у разработчика: справочник у каждого полигона свой
export type WasteTypeParams = ListParams & { landfillId?: string }

export type WasteTypeAnalytics = {
  wasteTypeId: string
  reportsCount: number
  totalNettoKg: number
  monthAverageNettoKg: number | null // null, если за месяц отчётов нет
  sharePercent: number // доля в объёме отходов полигона
}

export const wasteTypesApi = {
  list: (p: WasteTypeParams) => http.get<Paged<WasteType>>('/waste-types', p),
  get: (id: string) => http.get<WasteTypeDetails>(`/waste-types/${id}`),
  create: (d: WasteTypeInput) => http.post<WasteTypeDetails>('/waste-types', d),
  update: (id: string, d: WasteTypeInput) =>
    http.put<WasteTypeDetails>(`/waste-types/${id}`, { id, ...d }),
  remove: (id: string) => http.delete(`/waste-types/${id}`),
  restore: (id: string) => http.patch(`/waste-types/${id}/restore`),
  analytics: (id: string) => http.get<WasteTypeAnalytics>(`/waste-types/${id}/analytics`),
}
