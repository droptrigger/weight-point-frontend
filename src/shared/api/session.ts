import { useSyncExternalStore } from 'react'

export type Tokens = { accessToken: string; accessTokenExpiresAt: string; refreshToken: string }

const KEY = 'wp.session'
function read(): Tokens | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

let tokens = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const session = {
  get: () => tokens,
  set(next: Tokens) {
    tokens = next
    localStorage.setItem(KEY, JSON.stringify(next))
    emit()
  },
  clear() {
    tokens = null
    localStorage.removeItem(KEY)
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

// Вход или выход в другой вкладке применяется сразу и здесь
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return
  tokens = read()
  emit()
})

export const useIsAuthed = () => useSyncExternalStore(session.subscribe, () => tokens !== null)

export const useAccessToken = () =>
  useSyncExternalStore(session.subscribe, () => tokens?.accessToken ?? null)
