import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRemoteOptions } from '@/shared/lib/remoteOptions'
import { wasteTypesApi, type WasteType, type WasteTypeInput, type WasteTypeParams } from './api'
import { formatWasteCode } from './code'
import { isLicenseExpired, LICENSE_EXPIRED } from './license'

export const wasteTypeKeys = {
  all: ['waste-types'] as const,
  lists: () => [...wasteTypeKeys.all, 'list'] as const,
  list: (p: WasteTypeParams) => [...wasteTypeKeys.lists(), p] as const,
  one: (id: string) => [...wasteTypeKeys.all, 'one', id] as const,
  analytics: (id: string) => [...wasteTypeKeys.one(id), 'analytics'] as const,
}

export const useWasteTypes = (p: WasteTypeParams, enabled = true) =>
  useQuery({
    queryKey: wasteTypeKeys.list(p),
    queryFn: () => wasteTypesApi.list(p),
    placeholderData: keepPreviousData,
    enabled,
  })

// Виды отходов для выпадающих списков. landfillId нужен разработчику: у каждого полигона свой справочник
export const useWasteTypeOptions = (landfillId?: string, value?: string, enabled = true) =>
  useRemoteOptions<WasteType>({
    key: [...wasteTypeKeys.all, 'pick', landfillId ?? null],
    fetchPage: (p) => wasteTypesApi.list({ ...p, landfillId }),
    fetchOne: wasteTypesApi.get,
    toOption: (w) => ({
      value: w.id,
      label: `${formatWasteCode(w.code)} — ${w.name}`,
      // Выбрать можно, но с пометкой: принимать такие отходы полигон уже не вправе
      note: isLicenseExpired(w.validUntil) ? LICENSE_EXPIRED : undefined,
    }),
    value,
    enabled,
  })

export const useWasteType = (id: string) =>
  useQuery({ queryKey: wasteTypeKeys.one(id), queryFn: () => wasteTypesApi.get(id) })

// enabled = false — только плитки-заглушки: страница сущности запрашивает аналитику,
// когда сама сущность загрузилась, чтобы не слать запрос, если её нет (404)
export const useWasteTypeAnalytics = (id: string, enabled = true) =>
  useQuery({
    queryKey: wasteTypeKeys.analytics(id),
    queryFn: () => wasteTypesApi.analytics(id),
    enabled,
  })

export function useSaveWasteType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id?: string; data: WasteTypeInput }) =>
      v.id ? wasteTypesApi.update(v.id, v.data) : wasteTypesApi.create(v.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: wasteTypeKeys.all }),
  })
}

export function useDeleteWasteType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: wasteTypesApi.remove,
    // Карточка удалённой записи не перезапрашивается: со страницы происходит переход
    onSuccess: () => qc.invalidateQueries({ queryKey: wasteTypeKeys.lists() }),
  })
}

// Восстановленный вид отходов снова виден в карточке, списках и выпадающих меню
export function useRestoreWasteType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: wasteTypesApi.restore,
    onSuccess: () => qc.invalidateQueries({ queryKey: wasteTypeKeys.all }),
  })
}
