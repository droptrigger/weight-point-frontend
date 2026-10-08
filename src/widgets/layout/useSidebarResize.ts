import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { clamp } from '@/shared/lib/math'

// Свёрнутое меню — иконки с подписью снизу, развёрнутое — обычное
const SIDEBAR_COLLAPSED_W = 88
const SIDEBAR_EXPANDED_W = 240
// Уже этой ширины меню при перетаскивании показывается свёрнутым и при отпускании сворачивается
const THRESHOLD = (SIDEBAR_COLLAPSED_W + SIDEBAR_EXPANDED_W) / 2
// Сдвиг меньше этого — нажатие, а не перетаскивание
const TAP_SLOP = 4
const KEY = 'wp.sidebar.collapsed'

const read = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const write = (collapsed: boolean) => {
  try {
    localStorage.setItem(KEY, collapsed ? '1' : '0')
  } catch {
    // Хранилище недоступно: выбор живёт до перезагрузки
  }
}

// Ширина бокового меню: кромку и ручку тянут, при отпускании меню прилипает к одному из двух
// положений. Нажатие на ручку сворачивает и разворачивает меню; выбор запоминается в браузере
export function useSidebarResize() {
  const [collapsed, setCollapsed] = useState(read)
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const [pressed, setPressed] = useState(false)
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null)

  const width = dragWidth ?? (collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W)
  const change = (value: boolean) => {
    setCollapsed(value)
    write(value)
  }

  const end = (tap: boolean) => {
    const state = drag.current
    if (!state) return
    drag.current = null
    setPressed(false)
    setDragWidth(null)
    if (state.moved) change(width < THRESHOLD)
    else if (tap) change(!collapsed)
  }

  const pointerProps = (tap: boolean) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = { x: e.clientX, start: width, moved: false }
      setPressed(true)
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const state = drag.current
      if (!state) return
      if (!state.moved && Math.abs(e.clientX - state.x) < TAP_SLOP) return
      state.moved = true
      // Меню у левого края: движение вправо его расширяет
      const next = state.start + e.clientX - state.x
      setDragWidth(clamp(next, SIDEBAR_COLLAPSED_W, SIDEBAR_EXPANDED_W))
    },
    onPointerUp: () => end(tap),
    onPointerCancel: () => end(false),
  })

  return {
    width,
    // Во время перетаскивания вид меняется сразу, как только ширина переходит порог
    collapsed: width < THRESHOLD,
    dragging: pressed,
    handleProps: {
      ...pointerProps(false),
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'ArrowLeft') change(true)
        else if (e.key === 'ArrowRight') change(false)
        else if (e.key === 'Enter' || e.key === ' ') change(!collapsed)
        else return
        e.preventDefault()
      },
    },
    gripProps: pointerProps(true),
  }
}
