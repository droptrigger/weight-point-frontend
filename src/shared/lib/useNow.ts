import { useEffect, useState } from 'react'

// Текущее время, которое обновляется раз в intervalMs: для обратного отсчёта и «N минут назад»
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}
