import { useSyncExternalStore } from 'react'
import type { ReportStatusCode } from '../api'

// Изменение отчёта из SignalR. Самого отчёта в событии нет: открытые запросы перечитываются
export type ReportChange = {
  reportId: string
  landfillId: string
  kind: 'created' | 'updated' | 'deleted'
  status: ReportStatusCode | null
}

// connecting — первое подключение или переподключение, offline — сервер недоступен, повтор позже
export type LiveState = 'connecting' | 'online' | 'offline'

// Для того чтобы память не росла за долгий день, хранятся только последние изменения
const KNOWN_MAX = 2000

// seq — порядковый номер события: по нему видно, пришло ли изменение после какого-то момента
export type KnownChange = ReportChange & { seq: number }

let state: LiveState = 'offline'
let version = 0
let seq = 0
const known = new Map<string, KnownChange>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setLiveState(next: LiveState) {
  if (state === next) return
  state = next
  emit()
}

export function rememberChanges(changes: ReportChange[]) {
  for (const change of changes) {
    // Удаление и повторная вставка переносят отчёт в конец: в начале остаются самые старые
    known.delete(change.reportId)
    known.set(change.reportId, { ...change, seq: ++seq })
  }
  for (const id of known.keys()) {
    if (known.size <= KNOWN_MAX) break
    known.delete(id)
  }
  version++
  emit()
}

// Последнее известное изменение отчёта: по нему видно, почему отчёт пропал из списка
export const lastChange = (reportId: string) => known.get(reportId)

// Номер последнего события: отметка «до этого момента»
export const currentSeq = () => seq

export const useLiveState = () => useSyncExternalStore(subscribe, () => state)

// Меняется с каждой пачкой изменений: компоненты, которые читают lastChange, перерисовываются
export const useLiveVersion = () => useSyncExternalStore(subscribe, () => version)
