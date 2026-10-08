import { NavLink } from 'react-router-dom'
import { useCan } from '@/features/auth/permissions'
import { cx } from '@/shared/lib/cx'
import type { ReportStatusCode } from './api'
import { useReports } from './hooks'
import { LiveIndicator } from './live/LiveIndicator'

// Сколько отчётов в статусе: страница из одной строки, нужен только totalCount.
// Списки перечитываются по событиям сервера, поэтому счётчики живые
function useStatusCount(status: ReportStatusCode, enabled: boolean) {
  const query = useReports({ page: 1, pageSize: 1, status }, enabled)
  return query.data?.totalCount ?? 0
}

function Count({ value, tone }: { value: number; tone?: 'danger' }) {
  if (value === 0) return null
  return (
    <span className={cx('report-tab-count', tone && `report-tab-count--${tone}`)}>{value}</span>
  )
}

// Подразделы отчётов у проверяющих: все отчёты, очередь проверки и отправка в ФГИС УТКО.
// Остальным подразделы не нужны, у них только индикатор связи
export function ReportsTabs() {
  const canReview = useCan('reports.review')
  const review = useStatusCount('awaiting_review', canReview)
  const queued = useStatusCount('awaiting_sending', canReview)
  const sending = useStatusCount('sending', canReview)
  const failed = useStatusCount('sending_failed', canReview)

  return (
    <div className="report-tabs">
      {canReview && (
        <nav className="report-tabs-nav" aria-label="Подразделы отчётов">
          <NavLink end to="/reports" className="report-tab">
            Все отчёты
          </NavLink>
          <NavLink to="/reports/review" className="report-tab">
            На проверке
            <Count value={review} />
          </NavLink>
          <NavLink to="/reports/sending" className="report-tab">
            Отправка в ФГИС
            <Count value={queued + sending} />
            <Count value={failed} tone="danger" />
          </NavLink>
        </nav>
      )}
      <LiveIndicator />
    </div>
  )
}
