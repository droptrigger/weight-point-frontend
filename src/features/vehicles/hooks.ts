import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { landfillKeys } from '@/features/landfills/hooks'
import type { ChartPeriod } from '@/shared/lib/chart'
import { useRemoteOptions } from '@/shared/lib/remoteOptions'
import { plateLabel, vehiclesApi, type Vehicle, type VehicleInput, type VehicleParams } from './api'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (p: VehicleParams) => [...vehicleKeys.lists(), p] as const,
  one: (id: string) => [...vehicleKeys.all, 'one', id] as const,
  // Внутри ключа карточки: всё, что сбрасывает карточку машины, сбрасывает и аналитику
  analytics: (id: string) => [...vehicleKeys.one(id), 'analytics'] as const,
  nettoChart: (id: string, period: ChartPeriod) =>
    [...vehicleKeys.analytics(id), 'netto-chart', period] as const,
  visits: (id: string) => [...vehicleKeys.analytics(id), 'visits'] as const,
}

export const useVehicles = (p: VehicleParams) =>
  useQuery({
    queryKey: vehicleKeys.list(p),
    queryFn: () => vehiclesApi.list(p),
    placeholderData: keepPreviousData,
  })

// Машины для выпадающих списков, поиск по номеру. landfillId нужен разработчику: у каждого полигона свои машины
export const useVehicleOptions = (landfillId?: string, value?: string, enabled = true) =>
  useRemoteOptions<Vehicle>({
    key: [...vehicleKeys.all, 'pick', landfillId ?? null],
    fetchPage: (p) => vehiclesApi.list({ ...p, landfillId }),
    fetchOne: vehiclesApi.get,
    toOption: (v) => ({ value: v.id, label: plateLabel(v) }),
    value,
    enabled,
  })

export const useVehicle = (id: string) =>
  useQuery({ queryKey: vehicleKeys.one(id), queryFn: () => vehiclesApi.get(id) })

// enabled = false — только плитки-заглушки: страница сущности запрашивает аналитику,
// когда сама сущность загрузилась, чтобы не слать запрос, если её нет (404)
export const useVehicleAnalytics = (id: string, enabled = true) =>
  useQuery({
    queryKey: vehicleKeys.analytics(id),
    queryFn: () => vehiclesApi.analytics(id),
    enabled,
  })

// При смене периода остаётся прежний график, пока не загрузится новый. Период хранится
// вместе с данными, чтобы подписи прежнего графика не строились по новому периоду
export const useVehicleNettoChart = (id: string, period: ChartPeriod, enabled = true) =>
  useQuery({
    queryKey: vehicleKeys.nettoChart(id, period),
    queryFn: async () => ({ ...(await vehiclesApi.nettoChart(id, period)), period }),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useVehicleVisits = (id: string, enabled = true) =>
  useQuery({
    queryKey: vehicleKeys.visits(id),
    queryFn: () => vehiclesApi.visits(id),
    enabled,
  })

// Машины видны и в карточках полигонов, поэтому сбрасываются оба кеша
function useVehicleMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: vehicleKeys.all }),
        qc.invalidateQueries({ queryKey: landfillKeys.details() }),
      ]),
  })
}

export const useSaveVehicle = () =>
  useVehicleMutation((v: { id?: string; data: VehicleInput }) =>
    v.id ? vehiclesApi.update(v.id, v.data) : vehiclesApi.create(v.data),
  )

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: vehiclesApi.remove,
    // Карточка удалённой машины не перезапрашивается: со страницы происходит переход
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.lists() }),
  })
}

export const useRestoreVehicle = () => useVehicleMutation(vehiclesApi.restore)

export const useUploadVehicleImage = () =>
  useVehicleMutation((v: { id: string; file: File }) => vehiclesApi.uploadImage(v.id, v.file))
