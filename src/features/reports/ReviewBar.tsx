import { useState } from 'react'
import { CircleX } from 'lucide-react'
import { plateLabel } from '@/features/vehicles/api'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import type { ReviewStatusCode } from './api'
import { useChangeReportsStatus } from './hooks'
import { RejectModal } from './RejectModal'
import { REVIEW_ACTIONS } from './reviewActions'
import { canReviewTo } from './statuses'
import type { ReportSelection } from './useReportSelection'

type Skipped = { id: string; plate: string; reason: string }

// Панель массовых действий над выделенными отчётами. В запрос уходят только отчёты,
// которые можно перевести в выбранный статус; остальное сервер вернёт в skipped
export function ReviewBar({ selection }: { selection: ReportSelection }) {
  const change = useChangeReportsStatus()
  const confirmReject = useDisclosure()
  const [skipped, setSkipped] = useState<Skipped[]>([])

  const { selected } = selection
  const eligible = (to: ReviewStatusCode) => selected.filter((r) => canReviewTo(to, r.status.code))
  const toReject = eligible('rejected')
  // «Принять» видно всегда, а возврат на проверку и повтор отправки — только если такие отчёты выбраны
  const actions = REVIEW_ACTIONS.map((a) => ({ ...a, reports: eligible(a.to) })).filter(
    (a) => a.to === 'accepted' || a.reports.length > 0,
  )

  if (selected.length === 0 && skipped.length === 0) return null

  const run = (status: ReviewStatusCode, comment?: string, onDone?: () => void) => {
    const reports = eligible(status)
    const plates = new Map(reports.map((r) => [r.id, plateLabel(r)]))
    change.mutate(
      { ids: reports.map((r) => r.id), status, comment },
      {
        onSuccess: (result) => {
          selection.remove(result.updated.map((u) => u.reportId))
          setSkipped(
            result.skipped.map((s) => ({
              id: s.reportId,
              plate: plates.get(s.reportId) ?? s.reportId,
              reason: s.reason,
            })),
          )
          onDone?.()
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
                disabled={reports.length === 0 || change.isPending}
                onClick={() => run(to)}
              >
                <Icon className="icon" />
                {label} ({reports.length})
              </Button>
            ))}
            <Button
              variant="danger-soft"
              disabled={toReject.length === 0 || change.isPending}
              onClick={confirmReject.show}
            >
              <CircleX className="icon" />
              Отклонить ({toReject.length})
            </Button>
          </div>
          {!confirmReject.open && change.error && (
            <div className="modal-error selection-error">{change.error.message}</div>
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
