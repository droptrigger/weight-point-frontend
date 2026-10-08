import { http, type ListParams, type Paged } from '@/shared/api/http'

export type Make = { id: string; name: string; landfillId: string; isActive: boolean }
// landfillId учитывается только у разработчика: справочник у каждого полигона свой
export type MakeParams = ListParams & { landfillId?: string }

export const makesApi = {
  list: (p: MakeParams) => http.get<Paged<Make>>('/vehicle-make', p),
  get: (id: string) => http.get<Make>(`/vehicle-make/${id}`),
  create: (name: string, landfillId?: string) =>
    http.post<Make>('/vehicle-make', { name, landfillId }),
}
