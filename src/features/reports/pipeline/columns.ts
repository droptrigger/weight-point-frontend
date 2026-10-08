import { CircleCheck, CircleX, Hourglass, Send, type LucideIcon } from 'lucide-react'
import type { ReportParams, ReportSort, ReportStatusCode } from '../api'

export type PipelineTone = 'queue' | 'sending' | 'failed' | 'sent'

export type PipelineColumnConfig = {
  status: ReportStatusCode
  sort: ReportSort
  title: string
  icon: LucideIcon
  empty: string
  tone: PipelineTone
}

// Этапы отправки слева направо. В очереди старые сверху — в таком порядке отчёты и уходят,
// у ошибок и отправленных сверху последние
export const PIPELINE_COLUMNS: PipelineColumnConfig[] = [
  {
    status: 'awaiting_sending',
    sort: 'createdAt',
    title: 'В очереди',
    icon: Hourglass,
    empty: 'Очередь пуста',
    tone: 'queue',
  },
  {
    status: 'sending',
    sort: 'createdAt',
    title: 'Отправляются',
    icon: Send,
    empty: 'Сейчас ничего не отправляется',
    tone: 'sending',
  },
  {
    status: 'sending_failed',
    sort: '-updatedAt',
    title: 'Ошибки',
    icon: CircleX,
    empty: 'Ошибок нет',
    tone: 'failed',
  },
  {
    status: 'sent',
    sort: '-sentAt',
    title: 'Отправлены',
    icon: CircleCheck,
    empty: 'Отправленных пока нет',
    tone: 'sent',
  },
]

// Сколько отчётов видно в колонке: остальные — по ссылке на полный список
const PAGE_SIZE = 50

export const pipelineParams = (
  column: PipelineColumnConfig,
  landfillId?: string,
): ReportParams => ({
  page: 1,
  pageSize: PAGE_SIZE,
  status: column.status,
  sort: column.sort,
  landfillId,
})
