import { useEffect, useEffectEvent, useState } from 'react'
import { Search } from 'lucide-react'
import { useDebounce } from '@/shared/lib/useDebounce'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  span?: 1 | 2 | 3 | 4 // сколько колонок сетки фильтров занимает поле
}

export function SearchInput({ value, onChange, placeholder, span = 1 }: Props) {
  const [text, setText] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const debounced = useDebounce(text, 300)

  // Значение сменилось снаружи («Сбросить фильтры», «назад»), а не нашим же вызовом onChange
  if (value !== prevValue) {
    setPrevValue(value)
    if (value !== debounced) setText(value)
  }

  const emit = useEffectEvent((next: string) => {
    if (next !== value) onChange(next)
  })

  useEffect(() => emit(debounced), [debounced])

  return (
    <label className={`search-field span-${span}`}>
      <Search className="icon search-icon" />
      <input
        className="input"
        type="search"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </label>
  )
}
