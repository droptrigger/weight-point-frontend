import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/shared/api/http'
import type { ChartPeriod } from '@/shared/lib/chart'
import { useRemoteOptions } from '@/shared/lib/remoteOptions'
import { landfillsApi, type Landfill, type LandfillInput } from './api'

export const landfillKeys = {
  all: ['landfills'] as const,
  lists: () => [...landfillKeys.all, 'list'] as const,
  list: (p: ListParams) => [...landfillKeys.lists(), p] as const,
  details: () => [...landfillKeys.all, 'one'] as const,
  one: (id: string) => [...landfillKeys.details(), id] as const,
  // Внутри ключа карточки: всё, что сбрасывает карточку полигона, сбрасывает и аналитику
  analytics: (id: string) => [...landfillKeys.one(id), 'analytics'] as const,
  nettoChart: (id: string, period: ChartPeriod) =>
    [...landfillKeys.analytics(id), 'netto-chart', period] as const,
  reportsCalendar: (id: string) => [...landfillKeys.analytics(id), 'reports-calendar'] as const,
}

export const useLandfills = (p: ListParams, enabled = true) =>
  useQuery({
    queryKey: landfillKeys.list(p),
    queryFn: () => landfillsApi.list(p),
    placeholderData: keepPreviousData,
    enabled,
  })

// Полигоны для выпадающих списков
export const useLandfillOptions = (value?: string, enabled = true) =>
  useRemoteOptions<Landfill>({
    key: [...landfillKeys.all, 'pick'],
    fetchPage: landfillsApi.list,
    fetchOne: landfillsApi.get,
    toOption: (l) => ({ value: l.id, label: l.name }),
    value,
    enabled,
  })

export const useLandfill = (id: string, enabled = true) =>
  useQuery({ queryKey: landfillKeys.one(id), queryFn: () => landfillsApi.get(id), enabled })

// enabled = false — только плитки-заглушки: страница сущности запрашивает аналитику,
// когда сама сущность загрузилась, чтобы не слать запрос, если её нет (404)
export const useLandfillAnalytics = (id: string, enabled = true) =>
  useQuery({
    queryKey: landfillKeys.analytics(id),
    queryFn: () => landfillsApi.analytics(id),
    enabled,
  })

export const useLandfillNettoChart = (id: string, period: ChartPeriod, enabled = true) =>
  useQuery({
    queryKey: landfillKeys.nettoChart(id, period),
    queryFn: async () => ({ ...(await landfillsApi.nettoChart(id, period)), period }),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useLandfillReportsCalendar = (id: string, enabled = true) =>
  useQuery({
    queryKey: landfillKeys.reportsCalendar(id),
    queryFn: () => landfillsApi.reportsCalendar(id),
    enabled,
  })

export function useSaveLandfill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id?: string; data: LandfillInput }) =>
      v.id ? landfillsApi.update(v.id, v.data) : landfillsApi.create(v.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: landfillKeys.all }),
  })
}

export function useDeleteLandfill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: landfillsApi.remove,
    // Карточка удалённого полигона не перезапрашивается: со страницы происходит переход
    onSuccess: () => qc.invalidateQueries({ queryKey: landfillKeys.lists() }),
  })
}

// Восстановленный полигон снова виден в карточке, списках и выпадающих меню
export function useRestoreLandfill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: landfillsApi.restore,
    onSuccess: () => qc.invalidateQueries({ queryKey: landfillKeys.all }),
  })
}
