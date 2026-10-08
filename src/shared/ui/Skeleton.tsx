import type { CSSProperties, ReactNode } from 'react'

type SkeletonProps = {
  variant?: 'text' | 'title' | 'stat' | 'plate' | 'circle' | 'block'
  width?: CSSProperties['width']
  height?: CSSProperties['height']
}

// Серая заглушка на месте содержимого, которое ещё грузится
export function Skeleton({ variant = 'text', width, height }: SkeletonProps) {
  return (
    <span
      className={`skeleton skeleton--${variant}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

// Ширина ячеек немного разная, чтобы строки не выглядели одинаковой полосой
const CELL_WIDTHS = ['72%', '56%', '84%', '48%', '64%']

type TableSkeletonProps = {
  columns: ReactNode[] // те же заголовки, что у таблицы: заглушка только под текстовыми заголовками
  rows?: number
}

export function TableSkeletonRows({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <div role="status" aria-label="Загрузка">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="report-row skeleton-row">
          {columns.map((column, col) =>
            typeof column === 'string' && column ? (
              <Skeleton key={col} width={CELL_WIDTHS[(row + col) % CELL_WIDTHS.length]} />
            ) : (
              <span key={col} />
            ),
          )}
        </div>
      ))}
    </div>
  )
}

export function InfoListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <dl className="info-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="info-row">
          <dt>
            <Skeleton width={90} />
          </dt>
          <dd>
            <Skeleton width={CELL_WIDTHS[i % CELL_WIDTHS.length]} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

// Заглушка карточки сущности по умолчанию для DetailPage
export function EntityCardSkeleton() {
  return (
    <section className="info-card entity-card" role="status" aria-label="Загрузка">
      <div className="entity-head">
        <Skeleton variant="circle" width={56} height={56} />
        <div className="skeleton-stack" style={{ flex: 1 }}>
          <Skeleton width={80} height={12} />
          <Skeleton variant="title" width="60%" />
        </div>
      </div>
      <InfoListSkeleton />
    </section>
  )
}
