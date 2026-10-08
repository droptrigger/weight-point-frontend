import type { ReportStatus } from './api'

// Текст — название статуса с сервера, цвет — по коду (классы status-* в badges.css)
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge status-${status.code}`}>{status.name}</span>
}
