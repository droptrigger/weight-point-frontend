import { useId, useRef, useState, type KeyboardEvent, type UIEvent } from 'react'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { clamp } from '@/shared/lib/math'
import type { Option } from '@/shared/lib/options'
import { useClickOutside } from '@/shared/lib/useClickOutside'
import { Spinner } from './Spinner'

type Props = {
  id?: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  invalid?: boolean
  filter?: boolean // подсвечивать синим, когда выбрано не пустое значение
  compact?: boolean
  addLabel?: string
  onAdd?: () => void
  loading?: boolean // варианты ещё грузятся: список не открывается
  // Выбранная запись, которой нет среди загруженных вариантов (дальние страницы, отфильтрована поиском)
  current?: Option
  // Поиск и подгрузка страниц для справочников с сервера (см. remoteSelectProps)
  search?: string
  onSearch?: (search: string) => void
  searching?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

// Когда до конца списка остаётся меньше этого, подгружается следующая страница
const LOAD_MORE_GAP = 80

export function Select({
  id,
  value,
  options,
  onChange,
  invalid,
  filter,
  compact,
  addLabel,
  onAdd,
  loading = false,
  current,
  search,
  onSearch,
  searching,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(0)
  // Подпись выбранного пункта: после нового поиска его может не быть среди вариантов
  const [picked, setPicked] = useState<Option>()
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.findIndex((o) => o.value === value)
  const searchable = Boolean(onSearch)

  const label =
    options[selected]?.label ??
    [current, picked].find((o) => o?.value === value)?.label ??
    (value ? 'Выбрано' : '—')

  const close = () => {
    setOpen(false)
    onSearch?.('') // при следующем открытии — снова весь список
  }

  useClickOutside(root, open, close)

  const toggle = () => {
    if (open) return close()
    setFocus(Math.max(selected, 0))
    setOpen(true)
  }

  const choose = (i: number) => {
    const option = options[i]
    if (!option) return
    setPicked(option)
    onChange(option.value)
    close()
  }

  const loadMore = () => {
    if (hasMore && !loadingMore) onLoadMore?.()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return toggle()
      const step = e.key === 'ArrowDown' ? 1 : -1
      const next = clamp(focus + step, 0, options.length - 1)
      setFocus(next)
      if (next >= options.length - 3) loadMore()
    } else if (e.key === 'Enter' || (e.key === ' ' && e.target === e.currentTarget)) {
      // Пробел в поле поиска — это пробел, а не выбор
      e.preventDefault()
      if (open) choose(focus)
      else toggle()
    } else if (e.key === 'Escape' && open) {
      e.preventDefault() // закрывает только список, а не окно вокруг него
      e.stopPropagation()
      close()
    }
  }

  const onScroll = (e: UIEvent<HTMLUListElement>) => {
    const list = e.currentTarget
    if (list.scrollHeight - list.scrollTop - list.clientHeight < LOAD_MORE_GAP) loadMore()
  }

  return (
    <div
      ref={root}
      className={cx(
        'dropdown',
        compact && 'dropdown--compact',
        open && 'open',
        invalid && 'invalid',
        filter && value !== '' && 'is-set',
      )}
    >
      <button
        id={id}
        type="button"
        className="dropdown-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && !searchable ? `${listId}-${focus}` : undefined}
        aria-busy={loading || undefined}
        disabled={loading}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className="dropdown-label">{loading ? 'Загрузка…' : label}</span>
        {loading ? (
          <Spinner size="sm" label="Загрузка вариантов" />
        ) : (
          <ChevronDown className="icon dropdown-chevron" />
        )}
      </button>

      {open && (
        <div className="dropdown-menu">
          {searchable && (
            <label className="dropdown-search">
              <Search className="icon" />
              <input
                type="search"
                autoFocus
                autoComplete="off"
                placeholder="Поиск"
                aria-controls={listId}
                aria-activedescendant={`${listId}-${focus}`}
                value={search ?? ''}
                onChange={(e) => {
                  onSearch?.(e.target.value)
                  setFocus(0)
                }}
                onKeyDown={onKeyDown}
              />
              {searching && <Spinner size="sm" label="Поиск" />}
            </label>
          )}

          <ul id={listId} className="dropdown-list" role="listbox" onScroll={onScroll}>
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === selected}
                className={cx(
                  'dropdown-option',
                  i === selected && 'selected',
                  i === focus && 'focused',
                )}
                onMouseMove={() => setFocus(i)}
                onClick={() => choose(i)}
              >
                <span>{o.label}</span>
                {o.note && <span className="dropdown-note">{o.note}</span>}
                <Check className="icon dropdown-check" />
              </li>
            ))}
            {!options.length && !searching && <li className="dropdown-empty">Ничего не найдено</li>}
            {loadingMore && (
              <li className="dropdown-more">
                <Spinner size="sm" label="Загрузка" />
              </li>
            )}
          </ul>

          {onAdd && (
            <div className="dropdown-add-item">
              <button
                type="button"
                className="dropdown-add"
                onClick={() => {
                  close()
                  onAdd()
                }}
              >
                <Plus className="icon" />
                {addLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
