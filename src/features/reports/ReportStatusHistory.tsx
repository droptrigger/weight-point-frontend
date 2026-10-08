import { useCan } from '@/features/auth/permissions'
import { fullName } from '@/features/users/api'
import { cx } from '@/shared/lib/cx'
import { formatDateTime } from '@/shared/lib/format'
import { EntityLink } from '@/shared/ui/EntityLink'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useReportStatusHistory } from './hooks'
import { ReportStatusBadge } from './ReportStatusBadge'

// История смены статусов, новые записи сверху: последняя ошибка отправки в ФГИС УТКО видна сразу
export function ReportStatusHistory({ reportId }: { reportId: string }) {
  const canSeeUsers = useCan('users.view')
  const { data, isPending, isError } = useReportStatusHistory(reportId)

  return (
    <>
      <h2 className="section-title">История статусов</h2>
      <ol className="status-history">
        {isPending &&
          [0, 1].map((i) => (
            <li key={i} className="status-history-item">
              <Skeleton width={140} height={22} />
              <Skeleton width={180} height={14} />
            </li>
          ))}
        {isError && <li className="status-history-item muted">Не удалось загрузить историю</li>}
        {data?.length === 0 && <li className="status-history-item muted">Записей нет</li>}
        {data?.toReversed().map((h) => (
          <li key={h.id} className="status-history-item">
            <ReportStatusBadge status={h.status} />
            <span className="status-history-meta">
              {formatDateTime(h.changedAt)} ·{' '}
              {h.changedBy === null ? (
                'Система'
              ) : canSeeUsers ? (
                <EntityLink className="field-link" to={`/users/${h.changedBy.id}`}>
                  {fullName(h.changedBy)}
                </EntityLink>
              ) : (
                fullName(h.changedBy)
              )}
            </span>
            {h.comment && (
              <p
                className={cx(
                  'status-history-comment',
                  h.status.code === 'sending_failed' && 'status-history-comment--error',
                )}
              >
                {h.comment}
              </p>
            )}
          </li>
        ))}
      </ol>
    </>
  )
}
