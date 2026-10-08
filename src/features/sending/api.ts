import { http } from '@/shared/api/http'

// Настройки отправки отчётов полигона в ФГИС УТКО. Ключи приходят целиком звёздочками
// (по маске видно только, что ключ задан), сами ключи отдаёт только reveal по ПИН-коду
export type SendingSettings = {
  landfillId: string
  autoSendEnabled: boolean
  sendIntervalMinutes: number
  nextRunAt: string | null // null — отправка ещё ни разу не запланирована
  objectIdMasked: string | null // null — ключ не задан
  accessKeyMasked: string | null
  hasPin: boolean
  pinLockedUntil: string | null // ввод ПИН-кода заблокирован после 5 неверных попыток
}

// Состояние отправки без ключей и ПИН-кода: его видят все, кто отправляет отчёты вручную (с контролера полигона)
export type SendingStatus = Pick<
  SendingSettings,
  'landfillId' | 'autoSendEnabled' | 'sendIntervalMinutes' | 'nextRunAt'
> & { hasCredentials: boolean }

export type SendingSchedule = Pick<SendingSettings, 'autoSendEnabled' | 'sendIntervalMinutes'>

export type FgisCredentials = { objectId: string | null; accessKey: string | null }

// Вместе с ключами задаётся новый ПИН-код для их просмотра, старый не нужен
export type CredentialsInput = { objectId: string; accessKey: string; newPin: string }

// Смена ПИН-кода без замены ключей: всегда с текущим ПИН-кодом
export type PinInput = { currentPin: string; newPin: string }

const base = (landfillId: string) => `/landfill/${landfillId}/sending-settings`

export const sendingApi = {
  get: (landfillId: string) => http.get<SendingSettings>(base(landfillId)),
  status: (landfillId: string) => http.get<SendingStatus>(`/landfill/${landfillId}/sending-status`),
  updateSchedule: (landfillId: string, d: SendingSchedule) =>
    http.put<SendingSettings>(base(landfillId), { landfillId, ...d }),
  setPin: (landfillId: string, d: PinInput) =>
    http.put<SendingSettings>(`${base(landfillId)}/pin`, { landfillId, ...d }),
  // Только разработчик: стирает ПИН-код вместе с ключами и выключает автоотправку
  resetPin: (landfillId: string) => http.delete<SendingSettings>(`${base(landfillId)}/pin`),
  updateCredentials: (landfillId: string, d: CredentialsInput) =>
    http.put<SendingSettings>(`${base(landfillId)}/credentials`, { landfillId, ...d }),
  reveal: (landfillId: string, pin: string) =>
    http.post<FgisCredentials>(`${base(landfillId)}/credentials/reveal`, { landfillId, pin }),
}

export const hasCredentials = (s: SendingSettings) =>
  s.objectIdMasked !== null && s.accessKeyMasked !== null

export const isPinLocked = (s: SendingSettings) =>
  s.pinLockedUntil !== null && new Date(s.pinLockedUntil) > new Date()
