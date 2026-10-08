import { Monitor, Smartphone } from 'lucide-react'
import { Tooltip } from '@/shared/ui/Tooltip'
import type { ReportSource } from './api'
import { REPORT_SOURCE_LABELS } from './sources'

// Откуда пришёл отчёт: с телефона (мобильное приложение) или из веб-интерфейса
export function ReportSourceIcon({ source }: { source: ReportSource }) {
  const Icon = source === 1 ? Smartphone : Monitor
  const label = REPORT_SOURCE_LABELS[source]
  return (
    <Tooltip className="source-mark" content={label}>
      <Icon className="icon" role="img" aria-label={label} />
    </Tooltip>
  )
}
