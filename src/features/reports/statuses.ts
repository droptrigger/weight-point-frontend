import type { Option } from '@/shared/lib/options'
import type { ReportStatusCode, ReviewStatusCode } from './api'

// Порядок совпадает с жизненным циклом отчёта; подписи — как в справочнике report_statuses
export const REPORT_STATUSES: { code: ReportStatusCode; label: string }[] = [
  { code: 'awaiting_sync', label: 'Ожидает синхронизации' },
  { code: 'awaiting_review', label: 'Ожидает проверки' },
  { code: 'rejected', label: 'Отклонён' },
  { code: 'accepted', label: 'Принят' },
  { code: 'awaiting_sending', label: 'Ожидает отправки' },
  { code: 'sending', label: 'Отправляется' },
  { code: 'sent', label: 'Отправлен' },
  { code: 'sending_failed', label: 'Ошибка отправки' },
]

export const STATUS_OPTIONS: Option[] = [
  { value: '', label: 'Все статусы' },
  ...REPORT_STATUSES.map((s) => ({ value: s.code, label: s.label })),
]

export const isReportStatus = (v: string): v is ReportStatusCode =>
  REPORT_STATUSES.some((s) => s.code === v)

export const statusLabel = (code: ReportStatusCode) =>
  REPORT_STATUSES.find((s) => s.code === code)?.label ?? code

// Из каких статусов проверяющий может перевести отчёт (совпадает с правилами сервера)
export const REVIEW_FROM: Record<ReviewStatusCode, readonly ReportStatusCode[]> = {
  accepted: ['awaiting_review'],
  // Отклонить можно всё, что ещё не ушло и не уходит в ФГИС УТКО
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

// Вручную отправляются отчёты из очереди и повторно — с ошибкой (совпадает с правилами сервера)
export const SENDABLE: readonly ReportStatusCode[] = ['awaiting_sending', 'sending_failed']
export const isSendable = (from: ReportStatusCode) => SENDABLE.includes(from)

// Данные такого отчёта ушли или уходят в ФГИС УТКО: правка, замена фото и удаление закрыты
export const isLocked = (code: ReportStatusCode) => code === 'sending' || code === 'sent'
