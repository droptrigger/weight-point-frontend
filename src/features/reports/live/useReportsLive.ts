import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useOwnLandfillId, useRole } from '@/features/auth/permissions'
import { landfillKeys } from '@/features/landfills/hooks'
import { sendingKeys } from '@/features/sending/hooks'
import { API_ORIGIN, freshAccessToken } from '@/shared/api/http'
import { throttle } from '@/shared/lib/throttle'
import { reportKeys } from '../hooks'
import { rememberChanges, setLiveState, type ReportChange } from './store'

// Паузы между попытками подключения: сначала быстро, потом раз в полминуты, без конца
const RETRY_MS = [0, 2000, 5000, 10000, 30000]
const retryDelay = (attempt: number) => RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)]

// Списки перечитываются не чаще раза в секунду: отправка сотни отчётов не превращается в сотню запросов
const LIST_THROTTLE_MS = 1000
const ANALYTICS_THROTTLE_MS = 5000

function connect(qc: QueryClient) {
  const connection = new HubConnectionBuilder()
    .withUrl(`${API_ORIGIN}/hubs/reports`, {
      accessTokenFactory: freshAccessToken,
      // Токен уходит в строке запроса, куки не нужны: CORS на сервере не требует AllowCredentials
      withCredentials: false,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (ctx) => retryDelay(ctx.previousRetryCount),
    })
    .configureLogging(LogLevel.None)
    .build()

  const lists = throttle(
    () => qc.invalidateQueries({ queryKey: reportKeys.lists() }),
    LIST_THROTTLE_MS,
  )
  const analytics = throttle(
    () => qc.invalidateQueries({ queryKey: reportKeys.analyticsAll() }),
    ANALYTICS_THROTTLE_MS,
  )

  // Пока не было связи, изменения могли потеряться: перечитывается всё, что открыто
  const resync = () => {
    void qc.invalidateQueries({ queryKey: reportKeys.all })
    void qc.invalidateQueries({ queryKey: landfillKeys.details() })
  }

  connection.on('ReportsChanged', (changes: ReportChange[]) => {
    rememberChanges(changes)
    // Карточка, её фото и история статусов перечитываются, только если открыты
    for (const c of changes) void qc.invalidateQueries({ queryKey: reportKeys.one(c.reportId) })
    lists()
    // Аналитика считает количество отчётов, правка отчёта на неё почти не влияет
    if (changes.some((c) => c.kind !== 'updated')) analytics()
  })
  connection.on('SendingSettingsChanged', (landfillId: string) => {
    void qc.invalidateQueries({ queryKey: sendingKeys.settings(landfillId) })
    void qc.invalidateQueries({ queryKey: sendingKeys.status(landfillId) })
  })
  connection.on('Resync', resync)

  connection.onreconnecting(() => setLiveState('connecting'))
  connection.onreconnected(() => {
    setLiveState('online')
    resync()
  })

  // Автоматическое переподключение работает только после первого успешного подключения,
  // поэтому первое повторяется вручную, пока сервер не ответит
  let stopped = false
  let timer: number | undefined
  const start = async (attempt: number) => {
    setLiveState('connecting')
    try {
      await connection.start()
      if (stopped) return
      setLiveState('online')
      if (attempt > 0) resync()
    } catch {
      if (stopped) return
      setLiveState('offline')
      timer = window.setTimeout(() => void start(attempt + 1), retryDelay(attempt + 1))
    }
  }
  void start(0)

  return () => {
    stopped = true
    window.clearTimeout(timer)
    lists.cancel()
    analytics.cancel()
    setLiveState('offline')
    void connection.stop()
  }
}

// Изменения отчётов в реальном времени для всего приложения: списки, карточки, панель отчёта и отправка
// обновляются сами. Подключение пересоздаётся при смене роли или полигона в токене: от них зависит,
// изменения каких полигонов присылает сервер
export function useReportsLive() {
  const qc = useQueryClient()
  const role = useRole()
  const landfillId = useOwnLandfillId()

  useEffect(() => {
    if (!role) return
    return connect(qc)
  }, [qc, role, landfillId])
}
