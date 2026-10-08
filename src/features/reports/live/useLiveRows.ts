import { useEffect, useState } from 'react'
import type { ReportBrief } from '../api'
import { lastChange, type ReportChange } from './store'

// Сколько держится подсветка новой строки и сколько видна строка, ушедшая из списка
const FRESH_MS = 4000
const GONE_MS = 6000

export type LiveRow = {
  report: ReportBrief
  fresh?: boolean // появилась после открытия списка
  gone?: ReportChange // уже не подходит под список: статус сменился или отчёт удалён
}

type Gone = { report: ReportBrief; index: number; change: ReportChange; until: number }

type State = {
  key: string
  items: ReportBrief[] | undefined // последний настоящий (не заглушка) ответ для этого списка
  fresh: ReadonlyMap<string, number> // id → до какого момента подсвечивать
  gone: Gone[]
}

const NONE: ReadonlyMap<string, number> = new Map()

// Почему отчёт пропал из списка: последнее изменение из SignalR, если статус и правда сменился
function goneChange(report: ReportBrief): ReportChange | undefined {
  const change = lastChange(report.id)
  if (!change) return undefined
  return change.kind === 'deleted' || change.status !== report.status.code ? change : undefined
}

function diff(prev: State, items: ReportBrief[], keepGone: boolean): State {
  const now = Date.now()
  const ids = new Set(items.map((r) => r.id))
  const prevIds = new Set(prev.items?.map((r) => r.id))

  const fresh = new Map(prev.fresh)
  for (const r of items) if (!prevIds.has(r.id)) fresh.set(r.id, now + FRESH_MS)

  // Вернувшаяся в список строка больше не «ушедшая»
  const gone = prev.gone.filter((g) => !ids.has(g.report.id))
  if (keepGone) {
    prev.items?.forEach((report, index) => {
      if (ids.has(report.id) || gone.some((g) => g.report.id === report.id)) return
      const change = goneChange(report)
      if (change) gone.push({ report, index, change, until: now + GONE_MS })
    })
  }

  return { key: prev.key, items, fresh, gone }
}

const prune = (s: State, now: number): State => ({
  ...s,
  fresh: new Map([...s.fresh].filter(([, until]) => until > now)),
  gone: s.gone.filter((g) => g.until > now),
})

// Список, который обновляется сам: новые строки ненадолго подсвечиваются, а отчёты, ушедшие из списка
// из-за действия другого пользователя (например, их принял другой проверяющий), ещё несколько секунд
// стоят на своём месте бледными и с новым статусом, чтобы строки не прыгали под курсором.
// listKey — параметры списка: при их смене (другая страница, фильтр) подсветки нет
export function useLiveRows(
  items: ReportBrief[] | undefined,
  listKey: string,
  { placeholder, keepGone }: { placeholder: boolean; keepGone: boolean },
): LiveRow[] {
  const [state, setState] = useState<State>({
    key: listKey,
    items: undefined,
    fresh: NONE,
    gone: [],
  })

  // Состояние выводится из пропсов во время рендера (а не в эффекте), чтобы подсветка появилась
  // в том же кадре, что и новые строки. Заглушка (старая страница на месте новой) не сравнивается
  if (listKey !== state.key) {
    setState({ key: listKey, items: placeholder ? undefined : items, fresh: NONE, gone: [] })
  } else if (items && !placeholder && items !== state.items) {
    setState(state.items ? diff(state, items, keepGone) : { ...state, items })
  }

  const next = Math.min(...state.fresh.values(), ...state.gone.map((g) => g.until))
  useEffect(() => {
    if (!Number.isFinite(next)) return
    const timer = window.setTimeout(
      () => setState((s) => prune(s, Date.now())),
      Math.max(0, next - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [next])

  const rows: LiveRow[] = (items ?? []).map((report) => ({
    report,
    fresh: state.fresh.has(report.id),
  }))
  // Ушедшие строки встают туда, где были, чтобы соседние не сдвигались
  for (const g of [...state.gone].sort((a, b) => a.index - b.index)) {
    rows.splice(Math.min(g.index, rows.length), 0, { report: g.report, gone: g.change })
  }
  return rows
}
