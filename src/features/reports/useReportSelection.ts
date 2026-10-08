import { useState } from 'react'
import { toggled } from '@/shared/lib/math'
import type { ReportBrief } from './api'
import { isReviewable } from './statuses'

const NONE: ReadonlySet<string> = new Set()

// Выделение отчётов на текущей странице списка. Привязано к параметрам списка (listKey):
// при смене страницы или фильтров выделение сбрасывается само, без эффектов.
// Выделенными считаются только видимые отчёты, статус которых ещё можно менять
export function useReportSelection(items: ReportBrief[] | undefined, listKey: string) {
  const [state, setState] = useState({ key: listKey, ids: NONE })
  const ids = state.key === listKey ? state.ids : NONE
  const set = (next: ReadonlySet<string>) => setState({ key: listKey, ids: next })

  const selectable = (items ?? []).filter((r) => isReviewable(r.status.code))
  const selected = selectable.filter((r) => ids.has(r.id))
  const allSelected = selectable.length > 0 && selected.length === selectable.length

  return {
    selected,
    hasSelectable: selectable.length > 0,
    allSelected,
    someSelected: selected.length > 0 && !allSelected,
    isSelected: (id: string) => selected.some((r) => r.id === id),
    toggle: (id: string) => set(toggled(ids, id)),
    toggleAll: () => set(allSelected ? NONE : new Set(selectable.map((r) => r.id))),
    // Вызывается после ответа сервера, поэтому работает с актуальным выделением, а не с тем, что было при клике
    remove: (removed: string[]) =>
      setState((prev) => ({
        key: prev.key,
        ids: new Set([...prev.ids].filter((id) => !removed.includes(id))),
      })),
    clear: () => set(NONE),
  }
}

export type ReportSelection = ReturnType<typeof useReportSelection>
