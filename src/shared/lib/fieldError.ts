import { ApiError } from '@/shared/api/http'

export type LocalErrors<K extends string = string> = Partial<Record<K, string>>

// Ошибка поля: сначала локальная проверка, затем ответ сервера
export const fieldError = <K extends string>(error: unknown, local: LocalErrors<K>, key: K) =>
  local[key] || (error instanceof ApiError ? error.fields[key]?.[0] : undefined)
