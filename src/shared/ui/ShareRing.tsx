import { formatPercent } from '@/shared/lib/format'
import { clamp } from '@/shared/lib/math'
import { Skeleton } from './Skeleton'

type Props = {
  percent?: number
  label: string // что это за доля, например «от всего объёма отходов полигона»
  loading?: boolean
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Круговая диаграмма доли одной записи от общего объёма: дуга — доля, кольцо — остальное
export function ShareRing({ percent, label, loading = false }: Props) {
  const share = clamp(percent ?? 0, 0, 100)
  const text = formatPercent(percent)

  return (
    <section className="share" aria-busy={loading || undefined}>
      <div className="share-chart">
        {loading ? (
          <Skeleton variant="block" />
        ) : (
          <svg viewBox="0 0 120 120" role="img" aria-label={`${text} ${label}`}>
            <circle className="share-track" cx="60" cy="60" r={RADIUS}>
              <title>{`Остальные: ${formatPercent(100 - share)}`}</title>
            </circle>
            {share > 0 && (
              <circle
                className="share-arc"
                cx="60"
                cy="60"
                r={RADIUS}
                strokeDasharray={`${(share / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              >
                <title>{text}</title>
              </circle>
            )}
          </svg>
        )}
      </div>
      <div className="share-text">
        <div className="stat-value">{loading ? <Skeleton variant="stat" width="60%" /> : text}</div>
        <div className="stat-label">{label}</div>
      </div>
    </section>
  )
}
