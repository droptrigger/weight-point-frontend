import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRemoteOptions } from '@/shared/lib/remoteOptions'
import { makesApi, type Make } from './api'

const makeKeys = {
  all: ['makes'] as const,
}

// Марки для выпадающих списков. landfillId нужен разработчику: у каждого полигона свой справочник
export const useMakeOptions = (landfillId?: string, value?: string, enabled = true) =>
  useRemoteOptions<Make>({
    key: [...makeKeys.all, 'pick', landfillId ?? null],
    fetchPage: (p) => makesApi.list({ ...p, landfillId }),
    fetchOne: makesApi.get,
    toOption: (m) => ({ value: m.id, label: m.name }),
    value,
    enabled,
  })

export function useCreateMake() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { name: string; landfillId?: string }) => makesApi.create(v.name, v.landfillId),
    onSuccess: () => qc.invalidateQueries({ queryKey: makeKeys.all }),
  })
}
