import { CircleCheck, ListRestart, RotateCcw, type LucideIcon } from 'lucide-react'
import type { ReviewStatusCode } from './api'

// Переходы, которые проверяющий делает одной кнопкой. Отклонение отдельно: у него окно с причиной
export const REVIEW_ACTIONS: {
  to: Exclude<ReviewStatusCode, 'rejected'>
  icon: LucideIcon
  label: string
}[] = [
  { to: 'accepted', icon: CircleCheck, label: 'Принять' },
  { to: 'awaiting_review', icon: RotateCcw, label: 'Вернуть на проверку' },
  // Отчёт с ошибкой встаёт в очередь и уйдёт со следующей автоотправкой. Отправить сразу — отдельная кнопка
  { to: 'awaiting_sending', icon: ListRestart, label: 'Вернуть в очередь' },
]

// Причина отклонения сохраняется в истории статусов; лимит совпадает с сервером
export const REJECT_COMMENT_MAX = 1000
