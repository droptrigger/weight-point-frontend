import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { ListRestart, MapPin, Send, Settings, X } from 'lucide-react'
import { useMe } from '@/features/auth/hooks'
import { useCan, useOwnLandfillId } from '@/features/auth/permissions'
import { usePickedLandfill } from '@/features/landfills/usePickedLandfill'
import type { SendingStatus } from '@/features/sending/api'
import { useSendingStatus } from '@/features/sending/hooks'
import { plateLabel } from '@/features/vehicles/api'
import { formatDateTime, plural } from '@/shared/lib/format'
import { toggled } from '@/shared/lib/math'
import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { useNow } from '@/shared/lib/useNow'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ConfirmModal, Modal } from '@/shared/ui/Modal'
import { Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/Select'
import { Skeleton } from '@/shared/ui/Skeleton'
import type { ReportBrief, SendAllStatus, SendResult } from '../api'
import { reportListQuery, useSendAllReports, useSendReports } from '../hooks'
import { ReportDrawer } from '../ReportDrawer'
import { ReportsTabs } from '../ReportsTabs'
import { isSendable } from '../statuses'
import { PIPELINE_COLUMNS, pipelineParams } from './columns'
import { PipelineColumn } from './PipelineColumn'
import { useSendProgress, type SendProgress } from './useSendProgress'

const REPORT_FORMS: [string, string, string] = ['отчёт', 'отчёта', 'отчётов']

// Отправка в ФГИС УТКО в реальном времени: очередь, отправляемые сейчас, ошибки и отправленные.
// Отправить можно вручную (по одному, выбранные или все сразу), даже если автоотправка выключена.
// Разработчик выбирает полигон, остальные видят свой
export function SendingPipelinePage() {
  const canPick = useCan('landfills.filter')
  const canManage = useCan('sending.manage')
  const ownLandfillId = useOwnLandfillId()
  const me = useMe()
  const picked = usePickedLandfill(canPick)

  const landfillId = canPick ? picked.landfillId : (ownLandfillId ?? '')
  const name = canPick ? picked.name : me.data?.landfill?.name
  const noLandfill = !(canPick && picked.options.loading) && !landfillId

  return (
    <>
      <PageHeader title="Отправка в ФГИС УТКО" />

      <div className="content-body">
        <ReportsTabs />
        {noLandfill ? (
          <EmptyState
            icon={MapPin}
            title={canPick ? 'Полигонов пока нет' : 'Полигон не назначен'}
            description={
              canPick
                ? 'Отправка появится, когда будет добавлен хотя бы один полигон.'
                : 'Отчёты отправляются от имени полигона пользователя. Обратитесь к администратору.'
            }
          />
        ) : (
          <>
            <div className="analytics-head">
              <div>
                <h2 className="analytics-title">
                  {name ? `Полигон «${name}»` : <Skeleton width={220} />}
                </h2>
                <span className="analytics-sub">
                  Очередь и ход отправки обновляются сами, без перезагрузки страницы
                </span>
              </div>
              <div className="pipeline-head-actions">
                {canManage && landfillId && (
                  <Link
                    className="btn btn--ghost"
                    to={{
                      pathname: '/sending',
                      search: canPick ? `?landfillId=${landfillId}` : '',
                    }}
                  >
                    <Settings className="icon" />
                    Настройки ФГИС
                  </Link>
                )}
                {canPick && (
                  <div className="analytics-picker">
                    <Select
                      filter
                      value={picked.landfillId}
                      {...remoteSelectProps(picked.options, 'Выберите полигон')}
                      // Пустого пункта нет: отправка всегда идёт от одного полигона с его ключами
                      options={picked.options.options}
                      onChange={picked.pick}
                    />
                  </div>
                )}
              </div>
            </div>
            {/* key: выделение, ход отправки и окна не переносятся на другой полигон */}
            {landfillId && (
              <PipelineView
                key={landfillId}
                landfillId={landfillId}
                filterId={canPick ? landfillId : undefined}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

type Skipped = { id: string; plate: string; reason: string }

type ViewProps = {
  landfillId: string
  filterId?: string // полигон в запросах: только у разработчика, остальным его подставляет сервер
}

function PipelineView({ landfillId, filterId }: ViewProps) {
  const status = useSendingStatus(landfillId)
  const send = useSendReports()
  const sendAll = useSendAllReports()
  const progress = useSendProgress()
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [confirm, setConfirm] = useState<SendAllStatus | null>(null)
  const [skipped, setSkipped] = useState<Skipped[]>([])

  const params = PIPELINE_COLUMNS.map((c) => pipelineParams(c, filterId))
  const queries = useQueries({ queries: params.map(reportListQuery) })
  const byStatus = (code: string) => queries[PIPELINE_COLUMNS.findIndex((c) => c.status === code)]
  const count = (code: string) => byStatus(code)?.data?.totalCount ?? 0
  const items: ReportBrief[] = queries.flatMap((q) => q.data?.items ?? [])

  // Без ключей сервер ничего не отправит, поэтому кнопки и чекбоксы не показываются
  const canSend = status.data?.hasCredentials ?? false
  // В выделении остаются только видимые отчёты, которые ещё можно отправить:
  // ушедшие в отправку или отправленные другим пользователем выпадают сами
  const chosen = items.filter((r) => selected.has(r.id) && isSendable(r.status.code))
  const pendingIds: ReadonlySet<string> = new Set(send.isPending ? send.variables : [])

  const plates = new Map(items.map((r) => [r.id, plateLabel(r)]))
  const done = (since: number) => (result: SendResult) => {
    progress.track(result.queued, since)
    setSelected((prev) => new Set([...prev].filter((id) => !result.queued.includes(id))))
    setSkipped(
      result.skipped.map((s) => ({
        id: s.reportId,
        plate: plates.get(s.reportId) ?? s.reportId,
        reason: s.reason,
      })),
    )
  }

  const sendIds = (ids: string[]) => {
    sendAll.reset()
    send.mutate(ids, { onSuccess: done(progress.mark()) })
  }

  const runSendAll = (target: SendAllStatus) => {
    send.reset()
    const finish = done(progress.mark())
    sendAll.mutate(
      { status: target, landfillId: filterId },
      {
        onSuccess: (result) => {
          finish(result)
          setConfirm(null)
        },
      },
    )
  }

  // Открытый отчёт — в URL, как в списке отчётов: панель переживает обновление страницы
  const [searchParams, setSearchParams] = useSearchParams()
  const openId = searchParams.get('report')
  const openReport = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('report', id)
    else next.delete('report')
    setSearchParams(next, { replace: true })
  }

  const queued = count('awaiting_sending')
  const failed = count('sending_failed')
  const error = send.error ?? (confirm ? null : sendAll.error)

  return (
    <>
      <section className="pipeline-summary info-card">
        {status.data ? (
          <AutoSendState status={status.data} />
        ) : status.isError ? (
          <Notice tone="danger">{status.error.message}</Notice>
        ) : (
          <Skeleton width={320} />
        )}

        {canSend && (
          <div className="pipeline-actions">
            {chosen.length > 0 && (
              <Button
                variant="soft"
                loading={send.isPending}
                disabled={sendAll.isPending}
                onClick={() => sendIds(chosen.map((r) => r.id))}
              >
                <Send className="icon" />
                Отправить выбранные ({chosen.length})
              </Button>
            )}
            <Button
              disabled={queued === 0 || send.isPending}
              loading={sendAll.isPending && sendAll.variables.status === 'awaiting_sending'}
              onClick={() => setConfirm('awaiting_sending')}
            >
              <Send className="icon" />
              Отправить всю очередь{queued > 0 && ` (${queued})`}
            </Button>
            {failed > 0 && (
              <Button
                variant="danger-soft"
                disabled={send.isPending}
                loading={sendAll.isPending && sendAll.variables.status === 'sending_failed'}
                onClick={() => setConfirm('sending_failed')}
              >
                <ListRestart className="icon" />
                Повторить ошибки ({failed})
              </Button>
            )}
          </div>
        )}

        {status.data && !status.data.hasCredentials && (
          <Notice tone="danger">
            Ключи ФГИС УТКО не заданы, поэтому отчёты не отправляются ни автоматически, ни вручную.
            Их задаёт администрация полигона в разделе «Настройки ФГИС».
          </Notice>
        )}
        {error && <Notice tone="danger">{error.message}</Notice>}
        {progress.progress && (
          <ProgressStrip progress={progress.progress} onClose={progress.clear} />
        )}
      </section>

      <div className="pipeline">
        {PIPELINE_COLUMNS.map((column, i) => (
          <PipelineColumn
            key={column.status}
            column={column}
            query={queries[i]}
            listKey={JSON.stringify(params[i])}
            landfillId={filterId}
            canSend={canSend}
            pendingIds={pendingIds}
            selected={selected}
            openId={openId}
            onToggle={(id) => setSelected((prev) => toggled(prev, id))}
            onSend={sendIds}
            // Повторный клик по открытому отчёту закрывает панель
            onOpen={(id) => openReport(id === openId ? null : id)}
          />
        ))}
      </div>

      <ConfirmModal
        open={confirm !== null}
        title={confirm === 'sending_failed' ? 'Повторить отправку?' : 'Отправить очередь?'}
        text={
          confirm === 'sending_failed'
            ? `Отчёты с ошибкой отправки (${failed}) будут отправлены в ФГИС УТКО ещё раз.`
            : `Все отчёты из очереди (${queued}) будут отправлены в ФГИС УТКО сейчас, не дожидаясь автоматической отправки. Отменить отправку нельзя.`
        }
        confirmText="Отправить"
        loading={sendAll.isPending}
        error={sendAll.error?.message}
        onConfirm={() => confirm && runSendAll(confirm)}
        onClose={() => {
          setConfirm(null)
          sendAll.reset()
        }}
      />

      <Modal
        open={skipped.length > 0}
        title="Часть отчётов не отправлена"
        onClose={() => setSkipped([])}
      >
        <ul className="skipped-list">
          {skipped.map((s) => (
            <li key={s.id}>
              <span className="skipped-plate">{s.plate}</span>
              <span className="skipped-reason">{s.reason}</span>
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <Button onClick={() => setSkipped([])}>Понятно</Button>
        </div>
      </Modal>

      {openId && (
        <ReportDrawer
          id={openId}
          ids={items.map((r) => r.id)}
          onSelect={openReport}
          onClose={() => openReport(null)}
        />
      )}
    </>
  )
}

// «через 5 минут», пока до отправки меньше часа, дальше — дата и время
function nextRunText(nextRunAt: string | null, now: number) {
  if (!nextRunAt) return 'ещё не запланирована'
  const ms = new Date(nextRunAt).getTime() - now
  // Воркер проверяет расписание раз в минуту, поэтому точнее минуты время не известно
  if (ms <= 60_000) return 'в течение минуты'
  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `через ${plural(minutes, ['минуту', 'минуты', 'минут'])}`
  return formatDateTime(nextRunAt)
}

function AutoSendState({ status }: { status: SendingStatus }) {
  const now = useNow(15_000)

  return (
    <div className="pipeline-state">
      <span className="detail-icon detail-icon-lg">
        <Send className="icon" />
      </span>
      <div>
        <div className="pipeline-state-title">
          {status.autoSendEnabled ? 'Автоотправка включена' : 'Автоотправка выключена'}
        </div>
        <div className="muted">
          {status.autoSendEnabled
            ? `Каждые ${plural(status.sendIntervalMinutes, ['минуту', 'минуты', 'минут'])} · следующая ${nextRunText(status.nextRunAt, now)}`
            : 'Отчёты из очереди уходят только вручную: по одному, выбранные или все сразу'}
        </div>
      </div>
    </div>
  )
}

// Ход последней ручной отправки: полоса и счётчики, итог каждого отчёта приходит с сервера
function ProgressStrip({ progress, onClose }: { progress: SendProgress; onClose: () => void }) {
  const { total, sent, failed, finished, done } = progress

  return (
    <div className="send-progress" role="status">
      <div className="send-progress-text">
        <span>
          {done ? 'Отправка завершена' : 'Идёт отправка'}: {finished} из{' '}
          {plural(total, REPORT_FORMS)}
        </span>
        <span className="send-progress-counts">
          {sent > 0 && <span className="send-progress-ok">отправлено {sent}</span>}
          {failed > 0 && <span className="send-progress-failed">с ошибкой {failed}</span>}
        </span>
        {done && (
          <button type="button" className="icon-btn" aria-label="Скрыть" onClick={onClose}>
            <X className="icon" />
          </button>
        )}
      </div>
      <div
        className="send-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={finished}
      >
        <span className="send-progress-sent" style={{ width: `${(sent / total) * 100}%` }} />
        <span className="send-progress-fail" style={{ width: `${(failed / total) * 100}%` }} />
      </div>
    </div>
  )
}
