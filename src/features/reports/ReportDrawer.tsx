import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CloudAlert,
  Maximize2,
  Minimize2,
  RotateCw,
  SearchX,
  SquareArrowOutUpRight,
  X,
} from 'lucide-react'
import { isNotFound } from '@/shared/api/http'
import { cx } from '@/shared/lib/cx'
import { useResizableWidth } from '@/shared/lib/useResizableWidth'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EntityLink } from '@/shared/ui/EntityLink'
import { Tooltip } from '@/shared/ui/Tooltip'
import { usePrefetchReport, useReport } from './hooks'
import { ReportSkeleton, ReportView } from './ReportPage'

type Props = {
  id: string
  ids: string[] // отчёты текущей страницы списка по порядку: для «Пред./След.»
  onSelect: (id: string) => void
  onClose: () => void
}

const FULL_KEY = 'wp.reportDrawer.full'

const readFull = () => {
  try {
    return localStorage.getItem(FULL_KEY) === '1'
  } catch {
    return false
  }
}

const writeFull = (full: boolean) => {
  try {
    localStorage.setItem(FULL_KEY, full ? '1' : '0')
  } catch {
    // Хранилище недоступно: режим живёт до закрытия панели
  }
}

// Правый край панели навигации: дальше него панель не расширяется
const sidebarRight = () => document.querySelector('.sidebar')?.getBoundingClientRect().right ?? 0

// Клавиши не перехватываются, пока открыто окно (у него свои Esc и стрелки) или фокус в поле ввода
const ignoreKeys = (e: KeyboardEvent) =>
  e.defaultPrevented ||
  e.altKey ||
  e.ctrlKey ||
  e.metaKey ||
  document.querySelector('dialog[open]') !== null ||
  (e.target instanceof HTMLElement &&
    e.target.closest('input, textarea, select, [contenteditable="true"]') !== null)

// Отчёт в панели поверх списка: список с фильтрами, прокруткой и выделением остаётся на месте.
// Открытый отчёт хранится в URL (?report=<id>), так что ссылкой на него можно поделиться
export function ReportDrawer({ id, ids, onSelect, onClose }: Props) {
  const query = useReport(id)
  const prefetch = usePrefetchReport()
  const panel = useRef<HTMLElement>(null)
  // Развёрнутая панель занимает всю область контента; выбор запоминается в браузере
  const [full, setFull] = useState(readFull)
  const changeFull = (value: boolean) => {
    setFull(value)
    writeFull(value)
  }
  const toggleFull = () => changeFull(!full)
  // Уже 40% экрана панель не сужается, шире — до панели навигации.
  // Кромку, дотянутую до навигации, отпускают — панель разворачивается
  const resize = useResizableWidth({
    panel,
    storageKey: 'wp.reportDrawer.width',
    bounds: () => ({
      min: window.innerWidth * 0.4,
      max: window.innerWidth - sidebarRight(),
    }),
    onSnap: () => changeFull(true),
    onTap: onClose,
  })

  const index = ids.indexOf(id)
  const prev = index > 0 ? ids[index - 1] : undefined
  const next = index >= 0 ? ids[index + 1] : undefined

  const prefetchNeighbours = useEffectEvent(() => {
    if (prev) prefetch(prev)
    if (next) prefetch(next)
  })
  useEffect(() => prefetchNeighbours(), [prev, next])

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (ignoreKeys(e)) return
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft' && prev) onSelect(prev)
    else if (e.key === 'ArrowRight' && next) onSelect(next)
    // По коду клавиши: работает и в русской раскладке
    else if (e.code === 'KeyF' && !e.shiftKey) toggleFull()
    else return
    e.preventDefault()
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  // Фокус в панель при открытии: клавиатура и скринридер сразу работают с отчётом
  useEffect(() => panel.current?.focus(), [])

  const { data, isPending, error } = query

  return (
    <aside
      ref={panel}
      className={cx(
        'drawer',
        full && 'drawer--full',
        resize.dragging && 'drawer--dragging',
        resize.snapping && 'drawer--snap',
      )}
      style={
        resize.width && !full ? ({ '--drawer-w': `${resize.width}px` } as CSSProperties) : undefined
      }
      aria-label="Отчёт"
      tabIndex={-1}
    >
      {!full && (
        <div className="drawer-edge">
          {/* Кромка панели: тянуть мышью, двойной клик — ширина по умолчанию */}
          <div
            className={cx('drawer-resize', resize.dragging && 'dragging')}
            role="separator"
            aria-orientation="vertical"
            aria-label="Ширина панели"
            tabIndex={0}
            {...resize.handleProps}
          />
          {/* Ручка снаружи панели: нажать — закрыть, потянуть — изменить ширину */}
          <Tooltip
            className={cx('drawer-grip', resize.dragging && 'dragging')}
            hidden={resize.dragging}
            content={
              <span className="tooltip-text">
                Нажмите, чтобы закрыть, потяните, чтобы изменить ширину
              </span>
            }
          >
            <span className="drawer-grip-hit" {...resize.gripProps} />
          </Tooltip>
        </div>
      )}
      {resize.snapping && (
        <div className="drawer-snap-hint" role="status">
          <Maximize2 className="icon" />
          Отпустите, чтобы развернуть на весь экран
        </div>
      )}
      <header className="drawer-header">
        <div className="drawer-nav">
          <Tooltip content="Предыдущий отчёт">
            <button
              type="button"
              className="icon-btn"
              aria-label="Предыдущий отчёт"
              disabled={!prev}
              onClick={() => prev && onSelect(prev)}
            >
              <ChevronLeft className="icon" />
            </button>
          </Tooltip>
          <Tooltip content="Следующий отчёт">
            <button
              type="button"
              className="icon-btn"
              aria-label="Следующий отчёт"
              disabled={!next}
              onClick={() => next && onSelect(next)}
            >
              <ChevronRight className="icon" />
            </button>
          </Tooltip>
          <h2>Отчёт</h2>
          {index >= 0 && (
            <span className="drawer-count">
              {index + 1} из {ids.length}
            </span>
          )}
        </div>
        <div className="drawer-nav">
          <Tooltip content="Открыть отдельной страницей">
            <EntityLink className="icon-btn" to={`/reports/${id}`} aria-label="Открыть страницей">
              <SquareArrowOutUpRight className="icon" />
            </EntityLink>
          </Tooltip>
          <Tooltip content={full ? 'Свернуть (F)' : 'Развернуть на весь экран (F)'}>
            <button
              type="button"
              className="icon-btn"
              aria-label={full ? 'Свернуть' : 'Развернуть на весь экран'}
              aria-pressed={full}
              onClick={toggleFull}
            >
              {full ? <Minimize2 className="icon" /> : <Maximize2 className="icon" />}
            </button>
          </Tooltip>
          <Tooltip content="Закрыть (Esc)">
            <button type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose}>
              <X className="icon" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* key: при переходе к другому отчёту прокрутка и состояние (окна, сообщения) сбрасываются */}
      <div key={id} className="drawer-body">
        {isPending ? (
          <ReportSkeleton />
        ) : data ? (
          <ReportView report={data} onDeleted={onClose} />
        ) : isNotFound(error) ? (
          <EmptyState
            icon={SearchX}
            code="404"
            title="Отчёт не найден"
            description="Возможно, он удалён, у вас нет к нему доступа или ссылка устарела."
          />
        ) : (
          <EmptyState
            icon={CloudAlert}
            tone="danger"
            title="Не удалось загрузить отчёт"
            description="Проверьте подключение к сети и попробуйте ещё раз."
            actions={
              <Button onClick={() => query.refetch()} loading={query.isFetching}>
                {!query.isFetching && <RotateCw className="icon" />}
                Повторить
              </Button>
            }
          />
        )}
      </div>
    </aside>
  )
}
