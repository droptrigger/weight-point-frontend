import { useState } from 'react'
import { CircleX, Send } from 'lucide-react'
import { plateLabel } from '@/features/vehicles/api'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import type { ReviewStatusCode } from './api'
import { useChangeReportsStatus, useSendReports } from './hooks'
import { RejectModal } from './RejectModal'
import { REVIEW_ACTIONS } from './reviewActions'
import { canReviewTo, isSendable } from './statuses'
import type { ReportSelection } from './useReportSelection'

type Skipped = { id: string; plate: string; reason: string }

// Панель массовых действий над выделенными отчётами. В запрос уходят только отчёты,
// которые можно перевести в выбранный статус; остальное сервер вернёт в skipped
export function ReviewBar({ selection }: { selection: ReportSelection }) {
  const change = useChangeReportsStatus()
  const send = useSendReports()
  const busy = change.isPending || send.isPending
  const confirmReject = useDisclosure()
  const [skipped, setSkipped] = useState<Skipped[]>([])

  const { selected } = selection
  const eligible = (to: ReviewStatusCode) => selected.filter((r) => canReviewTo(to, r.status.code))
  const toReject = eligible('rejected')
  const toSend = selected.filter((r) => isSendable(r.status.code))
  // «Принять» видно всегда, а возврат на проверку и повтор отправки — только если такие отчёты выбраны
  const actions = REVIEW_ACTIONS.map((a) => ({ ...a, reports: eligible(a.to) })).filter(
    (a) => a.to === 'accepted' || a.reports.length > 0,
  )

  if (selected.length === 0 && skipped.length === 0) return null

  const plates = new Map(selected.map((r) => [r.id, plateLabel(r)]))
  const showSkipped = (list: { reportId: string; reason: string }[]) =>
    setSkipped(
      list.map((s) => ({
        id: s.reportId,
        plate: plates.get(s.reportId) ?? s.reportId,
        reason: s.reason,
      })),
    )

  const run = (status: ReviewStatusCode, comment?: string, onDone?: () => void) => {
    send.reset()
    change.mutate(
      { ids: eligible(status).map((r) => r.id), status, comment },
      {
        onSuccess: (result) => {
          selection.remove(result.updated.map((u) => u.reportId))
          showSkipped(result.skipped)
          onDone?.()
        },
      },
    )
  }

  // Отчёты встают в очередь отправки, ход видно по их статусу: «Отправляется», затем итог
  const runSend = () => {
    change.reset()
    send.mutate(
      toSend.map((r) => r.id),
      {
        onSuccess: (result) => {
          selection.remove(result.queued)
          showSkipped(result.skipped)
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
      {selected.length > 0 && (
        <div className="selection-bar" role="region" aria-label="Действия с выбранными отчётами">
          <span className="selection-count">Выбрано: {selected.length}</span>
          <button type="button" className="reset" onClick={selection.clear}>
            Снять выделение
          </button>
          <div className="selection-actions">
            {actions.map(({ to, icon: Icon, label, reports }) => (
              <Button
                key={to}
                variant="soft"
                loading={change.isPending && change.variables?.status === to}
                disabled={reports.length === 0 || busy}
                onClick={() => run(to)}
              >
                <Icon className="icon" />
                {label} ({reports.length})
              </Button>
            ))}
            {toSend.length > 0 && (
              <Button variant="soft" loading={send.isPending} disabled={busy} onClick={runSend}>
                <Send className="icon" />
                Отправить в ФГИС ({toSend.length})
              </Button>
            )}
            <Button
              variant="danger-soft"
              disabled={toReject.length === 0 || busy}
              onClick={confirmReject.show}
            >
              <CircleX className="icon" />
              Отклонить ({toReject.length})
            </Button>
          </div>
          {!confirmReject.open && (change.error || send.error) && (
            <div className="modal-error selection-error">
              {(change.error ?? send.error)?.message}
            </div>
          )}
        </div>
      )}

      <RejectModal
        open={confirmReject.open}
        title="Отклонить отчёты?"
        text={`Отклонить выбранные отчёты (${toReject.length})? Они не попадут в ФГИС УТКО. Позже их можно вернуть на проверку.`}
        loading={change.isPending}
        error={change.error?.message}
        onClose={closeReject}
        onConfirm={(comment) => run('rejected', comment, confirmReject.hide)}
      />

      <Modal
        open={skipped.length > 0}
        title="Часть отчётов не изменена"
        onClose={() => setSkipped([])}
      >
        <ul className="skipped-list">
          {skipped.map((s) => (
            <li key={s.id}>
              <span className="skipped-plate">{s.plate}</span>
              <span className="skipped-reason">{s.reason}</span>
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <Button onClick={() => setSkipped([])}>Понятно</Button>
        </div>
      </Modal>
    </>
  )
}
