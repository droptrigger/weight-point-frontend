import { session } from './session'

const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`

export type Paged<T> = { items: T[]; totalCount: number; page: number; pageSize: number }
export type ListParams = {
  page: number
  pageSize: number
  search: string
  includeInactive?: boolean // показать удалённые (неактивные) записи: право inactive.view
}
type Query = Record<string, string | number | boolean | undefined>

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string[]>

  constructor(
    status: number,
    code: string,
    message: string,
    fields: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get hasFieldErrors() {
    return Object.keys(this.fields).length > 0
  }
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

type ErrorBody = { ErrorStringCode?: string; Message?: string; Errors?: Record<string, string[]> }

const camelCase = (key: string) => key.charAt(0).toLowerCase() + key.slice(1)

function toApiError(status: number, body: ErrorBody | undefined): ApiError {
  const fields = Object.fromEntries(
    Object.entries(body?.Errors ?? {}).map(([key, messages]) => [camelCase(key), messages]),
  )
  return new ApiError(
    status,
    body?.ErrorStringCode ?? 'UNKNOWN',
    body?.Message ?? 'Не удалось выполнить запрос',
    fields,
  )
}

// Одновременные 401 ждут один и тот же refresh
let refreshing: Promise<boolean> | null = null
function refresh(): Promise<boolean> {
  const tokens = session.get()
  if (!tokens) return Promise.resolve(false)
  refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  })
    .then(async (r) => {
      if (!r.ok) return false
      session.set(await r.json())
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

function parse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : undefined
  } catch {
    return undefined
  }
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const tokens = session.get()
  const isForm = body instanceof FormData
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined && !isForm && { 'Content-Type': 'application/json' }),
      ...(tokens && { Authorization: `Bearer ${tokens.accessToken}` }),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  if (res.status === 401 && retry && tokens) {
    if (await refresh()) return request<T>(method, path, body, false)
    session.clear() // refresh тоже протух: выход, RequireAuth уводит на /login
  }

  const data = parse(await res.text()) // сервер отдаёт JSON с типом text/plain
  if (!res.ok) throw toApiError(res.status, data as ErrorBody | undefined)
  return data as T
}

function qs(params?: Query) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return search.size ? `?${search}` : ''
}

export const http = {
  get: <T>(path: string, params?: Query) => request<T>('GET', path + qs(params)),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}
