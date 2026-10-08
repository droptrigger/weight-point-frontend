import { todayString } from '@/shared/lib/dates'

export const LICENSE_EXPIRED = 'Лицензия истекла'

// validUntil — последний день действия лицензии (YYYY-MM-DD), null — бессрочная.
// Строки в этом формате сравниваются как даты
export const isLicenseExpired = (validUntil: string | null) =>
  validUntil !== null && validUntil < todayString()
