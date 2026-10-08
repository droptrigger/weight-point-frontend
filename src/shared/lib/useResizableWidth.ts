import { useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { clamp } from './math'

type Bounds = { min: number; max: number }

type Options = {
  panel: RefObject<HTMLElement | null>
  storageKey: string // ширина запоминается в localStorage этого браузера
  bounds: () => Bounds // считаются при каждом движении: зависят от текущего размера окна
  onSnap?: () => void // кромку дотянули до max и отпустили (например, развернуть панель)
  onTap?: () => void // ручку нажали, не потянув (например, закрыть панель)
}

const KEY_STEP = 32
// За сколько пикселей до max отпускание кромки считается «дотянули до упора»
const SNAP_ZONE = 32
// Сдвиг меньше этого — нажатие, а не перетаскивание
const TAP_SLOP = 4

const read = (key: string) => {
  try {
    const value = Number(localStorage.getItem(key))
    return value > 0 ? value : null
  } catch {
    return null
  }
}

const write = (key: string, value: number | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    // Хранилище недоступно (приватный режим): ширина живёт до перезагрузки
  }
}

// Ширина панели у правого края, которую тянут за левую кромку. null — ширина по умолчанию из CSS.
// Двойной клик по кромке возвращает ширину по умолчанию, стрелки на кромке меняют ширину с клавиатуры.
// С onSnap кромка, отпущенная у самого max, не запоминается: срабатывает onSnap, а ширина возвращается к прежней
export function useResizableWidth({ panel, storageKey, bounds, onSnap, onTap }: Options) {
  const [width, setWidth] = useState(() => read(storageKey))
  const [dragging, setDragging] = useState(false)
  const [snapping, setSnapping] = useState(false)
  const drag = useRef<{ x: number; start: number; before: number | null; moved: boolean } | null>(
    null,
  )

  const fit = (value: number) => {
    const { min, max } = bounds()
    return Math.round(clamp(value, min, Math.max(min, max)))
  }
  const current = () => width ?? panel.current?.getBoundingClientRect().width ?? bounds().min
  const commit = (value: number | null) => {
    setWidth(value)
    write(storageKey, value)
  }

  const endDrag = (tap?: () => void) => {
    const state = drag.current
    if (!state) return
    drag.current = null
    setDragging(false)
    setSnapping(false)
    if (!state.moved) tap?.()
    else if (snapping && onSnap) {
      setWidth(state.before)
      onSnap()
    } else write(storageKey, width)
  }

  // tap — нажатие без перетаскивания (для ручки: «нажмите, чтобы закрыть»)
  const pointerProps = (tap?: () => void) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = { x: e.clientX, start: current(), before: width, moved: false }
      setDragging(true)
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const state = drag.current
      if (!state) return
      // Дрожание руки при нажатии — ещё не перетаскивание
      if (!state.moved && Math.abs(e.clientX - state.x) < TAP_SLOP) return
      state.moved = true
      // Панель у правого края: движение влево её расширяет
      const wanted = state.start + state.x - e.clientX
      setWidth(fit(wanted))
      setSnapping(Boolean(onSnap) && wanted >= bounds().max - SNAP_ZONE)
    },
    onPointerUp: () => endDrag(tap),
    onPointerCancel: () => endDrag(),
  })

  return {
    width,
    dragging,
    snapping,
    // Кромка: тянуть, двойной клик — ширина по умолчанию, стрелки — с клавиатуры
    handleProps: {
      ...pointerProps(),
      onDoubleClick: () => commit(null),
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        const step = e.key === 'ArrowLeft' ? KEY_STEP : e.key === 'ArrowRight' ? -KEY_STEP : 0
        if (!step) return
        e.preventDefault()
        commit(fit(current() + step))
      },
    },
    // Ручка у кромки: тянуть так же, нажатие вызывает onTap
    gripProps: pointerProps(onTap),
  }
}
