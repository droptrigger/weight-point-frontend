import { CircleCheck, RotateCcw, Send, type LucideIcon } from 'lucide-react'
import type { ReviewStatusCode } from './api'

// Переходы, которые проверяющий делает одной кнопкой. Отклонение отдельно: у него окно с причиной
export const REVIEW_ACTIONS: {
  to: Exclude<ReviewStatusCode, 'rejected'>
  icon: LucideIcon
  label: string
}[] = [
  { to: 'accepted', icon: CircleCheck, label: 'Принять' },
  { to: 'awaiting_review', icon: RotateCcw, label: 'Вернуть на проверку' },
  { to: 'awaiting_sending', icon: Send, label: 'Повторить отправку' },
]

// Причина отклонения сохраняется в истории статусов; лимит совпадает с сервером
export const REJECT_COMMENT_MAX = 1000
