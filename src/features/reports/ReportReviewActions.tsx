import { CircleX, Send } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { Button } from '@/shared/ui/Button'
import type { ReportDetails, ReviewStatusCode } from './api'
import { useChangeReportsStatus, useSendReports } from './hooks'
import { RejectModal } from './RejectModal'
import { REVIEW_ACTIONS } from './reviewActions'
import { canReviewTo, isSendable } from './statuses'

type Props = {
  report: ReportDetails
  // Сервер может пропустить отчёт (например, не указан вид отхода) — страница показывает причину
  onMessage: (message: string | null) => void
}

// Кнопки проверки одного отчёта на его странице (без обёртки — их кладут в сводку).
// Тот же запрос, что и массовый в списке
export function ReportReviewActions({ report, onMessage }: Props) {
  const canReview = useCan('reports.review')
  const change = useChangeReportsStatus()
  const send = useSendReports()
  const busy = change.isPending || send.isPending
  const confirmReject = useDisclosure()

  const actions = REVIEW_ACTIONS.filter((a) => canReviewTo(a.to, report.status.code))
  const canReject = canReviewTo('rejected', report.status.code)
  const canSend = isSendable(report.status.code)
  if (!canReview || (actions.length === 0 && !canReject && !canSend)) return null

  // Отчёт сразу становится «Отправляется», итог карточка покажет сама, когда придёт событие с сервера
  const runSend = () => {
    onMessage(null)
    send.mutate([report.id], {
      onSuccess: (result) => onMessage(result.skipped[0]?.reason ?? null),
      onError: (error) => onMessage(error.message),
    })
  }

  const run = (status: ReviewStatusCode, comment?: string, onDone?: () => void) => {
    onMessage(null)
    change.mutate(
      { ids: [report.id], status, comment },
      {
        onSuccess: (result) => {
          onMessage(result.skipped[0]?.reason ?? null)
          onDone?.()
        },
        // Ошибку отклонения показывает окно подтверждения
        onError: (error) => {
          if (status !== 'rejected') onMessage(error.message)
        },
      },
    )
  }

  const closeReject = () => {
    confirmReject.hide()
    change.reset()
  }

  return (
    <>
      {canSend && (
        <Button variant="soft" loading={send.isPending} disabled={busy} onClick={runSend}>
          <Send className="icon" />
          Отправить в ФГИС
        </Button>
      )}
      {actions.map(({ to, icon: Icon, label }) => (
        <Button
          key={to}
          variant="soft"
          loading={change.isPending && change.variables?.status === to}
          disabled={busy}
          onClick={() => run(to)}
        >
          <Icon className="icon" />
          {label}
        </Button>
      ))}
      {canReject && (
        <Button variant="danger-soft" disabled={busy} onClick={confirmReject.show}>
          <CircleX className="icon" />
          Отклонить
        </Button>
      )}

      <RejectModal
        open={confirmReject.open}
        title="Отклонить отчёт?"
        text="Отклонённый отчёт не попадёт в ФГИС УТКО. Позже его можно вернуть на проверку."
        loading={change.isPending}
        error={change.error?.message}
        onClose={closeReject}
        onConfirm={(comment) => run('rejected', comment, confirmReject.hide)}
      />
    </>
  )
}
