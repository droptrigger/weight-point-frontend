import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@/shared/lib/cx'
import { clamp } from '@/shared/lib/math'

const GAP = 8 // от якоря до подсказки
const EDGE = 8 // минимальный отступ от краёв окна

type Props = {
  content: ReactNode
  className?: string
  hidden?: boolean // не показывать, пока, например, тянут элемент под подсказкой
  children: ReactNode
}

// Подсказка вместо системного title. Рендерится в body с position: fixed,
// чтобы её не обрезали контейнеры с overflow: hidden (например, таблица отчётов)
export function Tooltip({ content, className, hidden, children }: Props) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!open || hidden) return
    const a = anchor.current?.getBoundingClientRect()
    const t = tip.current?.getBoundingClientRect()
    if (!a || !t) return
    const left = clamp(a.left + a.width / 2 - t.width / 2, EDGE, window.innerWidth - t.width - EDGE)
    // Над иконкой, а если сверху не помещается — под ней
    const below = a.top - t.height - GAP < EDGE
    setPos({ top: below ? a.bottom + GAP : a.top - t.height - GAP, left, below })

    // При прокрутке подсказка отстала бы от иконки, поэтому она прячется
    const hide = () => setOpen(false)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
      setPos(null)
    }
  }, [open, hidden])

  const show = () => setOpen(true)
  const hide = () => setOpen(false)

  return (
    <>
      <span
        ref={anchor}
        className={className}
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => e.key === 'Escape' && hide()}
      >
        {children}
      </span>
      {open &&
        !hidden &&
        createPortal(
          <div
            ref={tip}
            id={id}
            role="tooltip"
            className={cx('tooltip', pos?.below && 'is-below')}
            style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}
