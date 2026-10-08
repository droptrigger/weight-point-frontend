import { Link } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import { CircleAlert, Clock, Recycle, RotateCw, Send } from 'lucide-react'
import { plateLabel } from '@/features/vehicles/api'
import type { Paged } from '@/shared/api/http'
import { cx } from '@/shared/lib/cx'
import { formatKg, formatShort } from '@/shared/lib/format'
import { PlateNumber } from '@/shared/ui/Badges'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Spinner } from '@/shared/ui/Spinner'
import { Tooltip } from '@/shared/ui/Tooltip'
import type { ReportBrief } from '../api'
import { useLiveRows } from '../live/useLiveRows'
import { isSendable } from '../statuses'
import type { PipelineColumnConfig } from './columns'

type Props = {
  column: PipelineColumnConfig
  query: UseQueryResult<Paged<ReportBrief>>
  listKey: string // параметры запроса колонки: при их смене (другой полигон) подсветки нет
  landfillId?: string // только у разработчика, остальным полигон подставляет сервер
  canSend: boolean // заданы ключи и есть право: видны кнопки и чекбоксы
  pendingIds: ReadonlySet<string> // запрос на отправку этих отчётов ещё в пути
  selected: ReadonlySet<string>
  openId: string | null
  onToggle: (id: string) => void
  onSend: (ids: string[]) => void
  onOpen: (id: string) => void
}

// Один этап отправки: отчёты в одном статусе. Список обновляется сам по событиям сервера,
// новые строки ненадолго подсвечиваются
export function PipelineColumn({
  column,
  query,
  listKey,
  landfillId,
  canSend,
  pendingIds,
  selected,
  openId,
  onToggle,
  onSend,
  onOpen,
}: Props) {
  const { status, title, icon: Icon, empty, tone } = column
  const rows = useLiveRows(query.data?.items, listKey, {
    placeholder: query.isPlaceholderData,
    keepGone: false,
  })
  const total = query.data?.totalCount ?? 0
  const more = total - rows.length
  // Полный список этапа в разделе «Все отчёты»
  const fullList = new URLSearchParams({ status, ...(landfillId && { landfillId }) })
  const sendLabel = tone === 'failed' ? 'Отправить ещё раз' : 'Отправить сейчас'

  return (
    <section className={cx('pipeline-column', `pipeline-column--${tone}`)} aria-label={title}>
      <header className="pipeline-head">
        <span className="pipeline-icon">
          <Icon className="icon" />
        </span>
        <h2 className="pipeline-title">{title}</h2>
        <span className="pipeline-count">{query.data ? total : <Skeleton width={20} />}</span>
      </header>

      <div className="pipeline-body">
        {query.isPending ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="pipeline-item pipeline-item--skeleton">
              <Skeleton width="70%" />
              <Skeleton width="45%" />
            </div>
          ))
        ) : query.isError ? (
          <div className="pipeline-empty">Не удалось загрузить</div>
        ) : rows.length === 0 ? (
          <div className="pipeline-empty">{empty}</div>
        ) : (
          rows.map(({ report, fresh }, index) => {
            const sendable = canSend && isSendable(report.status.code)
            const pending = pendingIds.has(report.id)
            return (
              <article
                key={report.id}
                className={cx(
                  'pipeline-item',
                  fresh && 'fresh',
                  selected.has(report.id) && 'selected',
                  report.id === openId && 'active',
                )}
              >
                {sendable && (
                  <span className="pipeline-check">
                    <input
                      type="checkbox"
                      aria-label={`Выбрать отчёт ${plateLabel(report)}`}
                      checked={selected.has(report.id)}
                      disabled={pending}
                      onChange={() => onToggle(report.id)}
                    />
                  </span>
                )}
                <button
                  type="button"
                  className="pipeline-open"
                  aria-current={report.id === openId || undefined}
                  onClick={() => onOpen(report.id)}
                >
                  <span className="pipeline-line">
                    <PlateNumber number={report.plateNumber} region={report.regionCode} />
                    <span className="pipeline-weight">{formatKg(report.weightNettoKg)}</span>
                  </span>
                  <span className="pipeline-meta">
                    {/* Номер в очереди: в таком порядке отчёты уйдут */}
                    {tone === 'queue' && <span className="pipeline-order">#{index + 1}</span>}
                    <span className="pipeline-meta-item">
                      {tone === 'sent' ? <Send className="icon" /> : <Clock className="icon" />}
                      {formatShort(tone === 'sent' ? report.sentAt : report.createdAt)}
                    </span>
                    {report.wasteType && (
                      <span className="pipeline-meta-item pipeline-meta-waste">
                        <Recycle className="icon" />
                        <span>{report.wasteType.name}</span>
                      </span>
                    )}
                  </span>
                  {tone === 'failed' && report.statusComment && (
                    <span className="pipeline-error">
                      <CircleAlert className="icon" />
                      <span>{report.statusComment}</span>
                    </span>
                  )}
                </button>
                {tone === 'sending' || pending ? (
                  <span className="pipeline-action">
                    <Spinner size="sm" label="Отправляется" />
                  </span>
                ) : (
                  sendable && (
                    <Tooltip
                      className="pipeline-action"
                      content={<span className="tooltip-text">{sendLabel}</span>}
                    >
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={sendLabel}
                        onClick={() => onSend([report.id])}
                      >
                        {tone === 'failed' ? (
                          <RotateCw className="icon" />
                        ) : (
                          <Send className="icon" />
                        )}
                      </button>
                    </Tooltip>
                  )
                )}
              </article>
            )
          })
        )}
      </div>

      {more > 0 && (
        <Link className="pipeline-more" to={{ pathname: '/reports', search: fullList.toString() }}>
          Ещё {more} — открыть списком
        </Link>
      )}
    </section>
  )
}
