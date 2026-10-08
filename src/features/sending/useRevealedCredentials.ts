import { useRef, useState } from 'react'
import type { FgisCredentials, SendingSettings } from './api'

// Сколько ключи остаются открытыми после ввода ПИН-кода
const REVEAL_MS = 60_000

// Ключи целиком после верного ПИН-кода. Они живут только в состоянии карточки и скрываются сами:
// через минуту, при замене ключей (сменится маска) и при уходе со страницы. В кеш запросов не попадают
export function useRevealedCredentials(settings: SendingSettings) {
  const [revealed, setRevealed] = useState<{ key: string; credentials: FgisCredentials } | null>(
    null,
  )
  const timer = useRef<number | undefined>(undefined)
  const key = `${settings.objectIdMasked}|${settings.accessKeyMasked}`

  const show = (credentials: FgisCredentials) => {
    window.clearTimeout(timer.current)
    setRevealed({ key, credentials })
    timer.current = window.setTimeout(() => setRevealed(null), REVEAL_MS)
  }

  return { credentials: revealed?.key === key ? revealed.credentials : null, show }
}
