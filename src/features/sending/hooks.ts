import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { landfillKeys } from '@/features/landfills/hooks'
import {
  sendingApi,
  type CredentialsInput,
  type PinInput,
  type SendingSchedule,
  type SendingSettings,
} from './api'

export const sendingKeys = {
  // Внутри ключа карточки полигона: всё, что сбрасывает полигон, сбрасывает и его настройки отправки
  settings: (landfillId: string) => [...landfillKeys.one(landfillId), 'sending-settings'] as const,
  status: (landfillId: string) => [...landfillKeys.one(landfillId), 'sending-status'] as const,
}

export const useSendingSettings = (landfillId: string, enabled = true) =>
  useQuery({
    queryKey: sendingKeys.settings(landfillId),
    queryFn: () => sendingApi.get(landfillId),
    enabled,
  })

export const useSendingStatus = (landfillId: string, enabled = true) =>
  useQuery({
    queryKey: sendingKeys.status(landfillId),
    queryFn: () => sendingApi.status(landfillId),
    enabled,
  })

// Сервер отвечает обновлёнными настройками, поэтому они сразу кладутся в кеш.
// Неверный ПИН-код меняет счётчик попыток и может заблокировать ввод, поэтому после ошибки настройки перечитываются
function useSettingsMutation<V>(landfillId: string, fn: (v: V) => Promise<SendingSettings>) {
  const qc = useQueryClient()
  const key = sendingKeys.settings(landfillId)
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(key, data)
      return qc.invalidateQueries({ queryKey: sendingKeys.status(landfillId) })
    },
    onError: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export const useUpdateSchedule = (landfillId: string) =>
  useSettingsMutation(landfillId, (d: SendingSchedule) => sendingApi.updateSchedule(landfillId, d))

export const useSetPin = (landfillId: string) =>
  useSettingsMutation(landfillId, (d: PinInput) => sendingApi.setPin(landfillId, d))

export const useResetPin = (landfillId: string) =>
  useSettingsMutation(landfillId, () => sendingApi.resetPin(landfillId))

export const useUpdateCredentials = (landfillId: string) =>
  useSettingsMutation(landfillId, (d: CredentialsInput) =>
    sendingApi.updateCredentials(landfillId, d),
  )

// Ключи целиком живут только в состоянии этой мутации внутри окна и пропадают вместе с ним
export function useRevealCredentials(landfillId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pin: string) => sendingApi.reveal(landfillId, pin),
    onSettled: () => qc.invalidateQueries({ queryKey: sendingKeys.settings(landfillId) }),
  })
}
