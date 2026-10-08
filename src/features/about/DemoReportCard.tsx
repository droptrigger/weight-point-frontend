import { ArrowLeft, CircleX, ScanText } from 'lucide-react'
import type { ReviewStatusCode } from '@/features/reports/api'
import { ReportStatusBadge } from '@/features/reports/ReportStatusBadge'
import { REVIEW_ACTIONS } from '@/features/reports/reviewActions'
import { canReviewTo } from '@/features/reports/statuses'
import { formatKg } from '@/shared/lib/format'
import { PlateNumber } from '@/shared/ui/Badges'
import { Button } from '@/shared/ui/Button'
import { DEMO_VEHICLES, type DemoReport } from './demoData'
import { ScalePhoto, VehiclePhoto } from './DemoPhotos'
import { demoStatus } from './demoStatus'

type Props = {
  report: DemoReport
  onBack: () => void
  onReview: (to: ReviewStatusCode) => void
}

// Табло весов с отметкой, что вес распознан с фото
function ScaleFrame({ kg }: { kg: number }) {
  return (
    <div className="photo-frame demo-photo">
      <ScalePhoto kg={kg} />
      <span className="demo-photo-chip">
        <ScanText className="icon" />
        Распознано
      </span>
    </div>
  )
}

// Карточка отчёта как в системе (ReportPage): сводка со статусом и кнопками, вес и фото.
// Вместо фото иллюстрации (DemoPhotos): машина на весах с госномером и табло весового терминала
export function DemoReportCard({ report: r, onBack, onReview }: Props) {
  const make = DEMO_VEHICLES.find((v) => v.plate === r.plate)?.make
  const bruttoKg = r.nettoKg + r.taraKg

  return (
    <div className="demo-report">
      <div className="demo-page-head demo-report-head">
        <button type="button" className="back" aria-label="Назад к отчётам" onClick={onBack}>
          <ArrowLeft className="icon" />
        </button>
        <div>
          <h3>Отчёт</h3>
          <span className="demo-page-sub">
            {[make, r.wasteType, r.carrier].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>

      <section className="summary demo-summary">
        <div className="summary-left">
          <div>
            <div className="muted">Создан</div>
            <div className="summary-date">Сегодня, {r.time}</div>
          </div>
          {/* key: бейдж заново проигрывает появление при смене статуса */}
          <span className="demo-status" key={r.status}>
            <ReportStatusBadge status={demoStatus(r.status)} />
          </span>
        </div>
        <div className="summary-actions">
          {REVIEW_ACTIONS.filter((a) => canReviewTo(a.to, r.status)).map(
            ({ to, icon: Icon, label }) => (
              <Button key={to} variant="soft" onClick={() => onReview(to)}>
                <Icon className="icon" />
                {label}
              </Button>
            ),
          )}
          {canReviewTo('rejected', r.status) && (
            <Button variant="danger-soft" onClick={() => onReview('rejected')}>
              <CircleX className="icon" />
              Отклонить
            </Button>
          )}
        </div>
      </section>

      <section className="weighing demo-weighing">
        <figure className="weigh-card">
          <div className="stat">
            <div className="stat-label">Вес отходов</div>
            <div className="stat-value">{formatKg(r.nettoKg)}</div>
            <div className="stat-sub">С грузом − пустая</div>
          </div>
          <div className="photo-frame demo-photo demo-photo--vehicle">
            <VehiclePhoto carrier={r.carrier} />
            <span className="photo-plate">
              <PlateNumber number={r.plate} region={r.region} />
            </span>
          </div>
        </figure>
        <figure className="weigh-card">
          <div className="stat">
            <div className="stat-label">Машина с грузом</div>
            <div className="stat-value">{formatKg(bruttoKg)}</div>
            <div className="stat-sub">Сегодня, {r.time}</div>
          </div>
          <ScaleFrame kg={bruttoKg} />
        </figure>
        <figure className="weigh-card">
          <div className="stat">
            <div className="stat-label">Пустая машина</div>
            <div className="stat-value">{formatKg(r.taraKg)}</div>
            <div className="stat-sub">Сегодня, {r.taraTime}</div>
          </div>
          <ScaleFrame kg={r.taraKg} />
        </figure>
      </section>
    </div>
  )
}
