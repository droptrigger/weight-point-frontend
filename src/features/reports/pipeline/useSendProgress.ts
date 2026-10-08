import { useState } from 'react'
import { currentSeq, lastChange, useLiveVersion } from '../live/store'

type Batch = { ids: string[]; since: number }

// Ход ручной отправки: сколько отчётов из поставленных в очередь уже отправлено и сколько с ошибкой.
// Итог каждого отчёта приходит через SignalR, а seq отсекает статусы, известные ещё до нажатия
export function useSendProgress() {
  const [batch, setBatch] = useState<Batch | null>(null)
  useLiveVersion()

  // Отметка берётся до запроса: сервер может прислать итог раньше, чем ответит на сам запрос
  const mark = () => currentSeq()
  const track = (ids: string[], since: number) => setBatch(ids.length ? { ids, since } : null)
  const clear = () => setBatch(null)

  if (!batch) return { progress: null, mark, track, clear }

  let sent = 0
  let failed = 0
  let finished = 0
  for (const id of batch.ids) {
    const change = lastChange(id)
    if (!change || change.seq <= batch.since || change.status === 'sending') continue
    finished++
    if (change.status === 'sent') sent++
    else if (change.status === 'sending_failed') failed++
    // Остальное — отчёт ушёл из отправки иначе: его вернули в очередь, отклонили или удалили
  }

  const total = batch.ids.length
  return {
    progress: { total, sent, failed, finished, done: finished >= total },
    mark,
    track,
    clear,
  }
}

export type SendProgress = NonNullable<ReturnType<typeof useSendProgress>['progress']>
