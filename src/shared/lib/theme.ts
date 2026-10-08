import { useSyncExternalStore } from 'react'

// «Как в системе» — без data-theme: тему выбирает prefers-color-scheme в tokens.css
export type ThemeChoice = 'system' | 'light' | 'dark'

// Тот же ключ читает скрипт в index.html, чтобы применить тему до отрисовки
const KEY = 'wp.theme'

function read(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'system') delete root.dataset.theme
  else root.dataset.theme = choice
}

let current = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const theme = {
  get: () => current,
  set(next: ThemeChoice) {
    current = next
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      // без localStorage тема держится до перезагрузки
    }
    apply(next)
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

// Тема, выбранная в другой вкладке, применяется и здесь
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return
  current = read()
  apply(current)
  emit()
})

export const useTheme = () => useSyncExternalStore(theme.subscribe, theme.get)
