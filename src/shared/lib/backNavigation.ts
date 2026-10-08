import { useLocation } from 'react-router-dom'

// Куда вести кнопку «Назад»: адрес страницы с query и её собственный state.
// State вложенный, поэтому «Назад» по цепочке (список → отчёт → машина) восстанавливает каждый шаг
export type BackTarget = { to: string; state: unknown }
type BackState = { back: BackTarget }

// Ограничение длины цепочки, чтобы state истории не рос бесконечно при переходах туда-обратно
const MAX_DEPTH = 10

const readBack = (state: unknown): BackTarget | null => {
  const back = (state as Partial<BackState> | null)?.back
  return typeof back?.to === 'string' ? back : null
}

const limitDepth = (state: unknown, depth: number): BackState | null => {
  const back = readBack(state)
  if (!back || depth <= 0) return null
  return { back: { to: back.to, state: limitDepth(back.state, depth - 1) } }
}

// State для ссылки на страницу сущности: запоминает текущую страницу как точку возврата
export function useForwardState(): BackState {
  const { pathname, search, state } = useLocation()
  return { back: { to: pathname + search, state: limitDepth(state, MAX_DEPTH - 1) } }
}

// Точка возврата текущей страницы; без неё (открыли по прямой ссылке) — fallback
export function useBackTarget(fallback: string): BackTarget {
  return readBack(useLocation().state) ?? { to: fallback, state: null }
}
