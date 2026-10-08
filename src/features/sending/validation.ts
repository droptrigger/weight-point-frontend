export const PIN_LENGTH = 6

// Совпадает с проверкой сервера: интервал от 1 минуты до суток
export const MIN_INTERVAL = 1
export const MAX_INTERVAL = 1440

// Пример в плейсхолдере полей ключей: видно, в каком виде вводить
export const GUID_EXAMPLE = '3f2a6c1e-0b7d-4a8e-9c55-1d2e3f4a5b6c'

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isPin = (value: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(value)

export const isGuid = (value: string) => GUID.test(value.trim())

export const pinError = (value: string) =>
  isPin(value) ? undefined : `ПИН-код из ${PIN_LENGTH} цифр`

export const guidError = (value: string) =>
  isGuid(value) ? undefined : `Формат GUID, например ${GUID_EXAMPLE}`
