import type { ReportStatusCode } from '@/features/reports/api'
import { REPORT_STATUSES } from '@/features/reports/statuses'

// Статус в том виде, в каком его отдаёт API, для ReportStatusBadge
export const demoStatus = (code: ReportStatusCode) => ({
  code,
  name: REPORT_STATUSES.find((s) => s.code === code)?.label ?? code,
})
