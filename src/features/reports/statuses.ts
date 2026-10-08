import type { Option } from '@/shared/lib/options'
import type { ReportStatusCode, ReviewStatusCode } from './api'

// Порядок совпадает с жизненным циклом отчёта; подписи — как в справочнике report_statuses
export const REPORT_STATUSES: { code: ReportStatusCode; label: string }[] = [
  { code: 'awaiting_sync', label: 'Ожидает синхронизации' },
  { code: 'awaiting_review', label: 'Ожидает проверки' },
  { code: 'rejected', label: 'Отклонён' },
  { code: 'accepted', label: 'Принят' },
  { code: 'awaiting_sending', label: 'Ожидает отправки' },
  { code: 'sent', label: 'Отправлен' },
  { code: 'sending_failed', label: 'Ошибка отправки' },
]

export const STATUS_OPTIONS: Option[] = [
  { value: '', label: 'Все статусы' },
  ...REPORT_STATUSES.map((s) => ({ value: s.code, label: s.label })),
]

export const isReportStatus = (v: string): v is ReportStatusCode =>
  REPORT_STATUSES.some((s) => s.code === v)

// Из каких статусов проверяющий может перевести отчёт (совпадает с правилами сервера)
export const REVIEW_FROM: Record<ReviewStatusCode, readonly ReportStatusCode[]> = {
  accepted: ['awaiting_review'],
  // Отклонить можно всё, что ещё не ушло в ФГИС УТКО
  rejected: ['awaiting_sync', 'awaiting_review', 'accepted', 'awaiting_sending', 'sending_failed'],
  awaiting_review: ['rejected'],
  awaiting_sending: ['sending_failed'],
}

const REVIEW_CODES = Object.keys(REVIEW_FROM) as ReviewStatusCode[]

export const canReviewTo = (to: ReviewStatusCode, from: ReportStatusCode) =>
  REVIEW_FROM[to].includes(from)

// Отправленный в ФГИС УТКО отчёт больше не меняется
export const isReviewable = (from: ReportStatusCode) =>
  REVIEW_CODES.some((to) => canReviewTo(to, from))
