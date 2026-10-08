import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRemoteOptions } from '@/shared/lib/remoteOptions'
import { carriersApi, type Carrier, type CarrierParams } from './api'

export const carrierKeys = {
  all: ['carriers'] as const,
  lists: () => [...carrierKeys.all, 'list'] as const,
  list: (p: CarrierParams) => [...carrierKeys.lists(), p] as const,
  one: (id: string) => [...carrierKeys.all, 'one', id] as const,
  analytics: (id: string) => [...carrierKeys.one(id), 'analytics'] as const,
}

export const useCarriers = (p: CarrierParams, enabled = true) =>
  useQuery({
    queryKey: carrierKeys.list(p),
    queryFn: () => carriersApi.list(p),
    placeholderData: keepPreviousData,
    enabled,
  })

// Перевозчики для выпадающих списков. landfillId нужен разработчику: у каждого полигона свой справочник
export const useCarrierOptions = (landfillId?: string, value?: string, enabled = true) =>
  useRemoteOptions<Carrier>({
    key: [...carrierKeys.all, 'pick', landfillId ?? null],
    fetchPage: (p) => carriersApi.list({ ...p, landfillId }),
    fetchOne: carriersApi.get,
    toOption: (c) => ({ value: c.id, label: c.name }),
    value,
    enabled,
  })

export const useCarrier = (id: string) =>
  useQuery({ queryKey: carrierKeys.one(id), queryFn: () => carriersApi.get(id) })

// enabled = false — только плитки-заглушки: страница сущности запрашивает аналитику,
// когда сама сущность загрузилась, чтобы не слать запрос, если её нет (404)
export const useCarrierAnalytics = (id: string, enabled = true) =>
  useQuery({
    queryKey: carrierKeys.analytics(id),
    queryFn: () => carriersApi.analytics(id),
    enabled,
  })

export function useSaveCarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id?: string; name: string; landfillId?: string }) =>
      v.id ? carriersApi.update(v.id, v.name) : carriersApi.create(v.name, v.landfillId),
    onSuccess: () => qc.invalidateQueries({ queryKey: carrierKeys.all }),
  })
}

export function useDeleteCarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: carriersApi.remove,
    // Карточка удалённого перевозчика не перезапрашивается: со страницы происходит переход
    onSuccess: () => qc.invalidateQueries({ queryKey: carrierKeys.lists() }),
  })
}

// Восстановленный перевозчик снова виден в карточке, списках и выпадающих меню
export function useRestoreCarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: carriersApi.restore,
    onSuccess: () => qc.invalidateQueries({ queryKey: carrierKeys.all }),
  })
}
