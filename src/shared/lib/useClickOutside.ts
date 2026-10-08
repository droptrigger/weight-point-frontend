import { useEffect, useEffectEvent, type RefObject } from 'react'

// Пока active, клик вне элемента вызывает onOutside (закрытие выпадающих списков)
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void,
) {
  const handle = useEffectEvent((e: MouseEvent) => {
    if (!ref.current?.contains(e.target as Node)) onOutside()
  })

  useEffect(() => {
    if (!active) return
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [active])
}
