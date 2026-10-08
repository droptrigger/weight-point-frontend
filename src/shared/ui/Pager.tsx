import { cx } from '@/shared/lib/cx'
import { Select } from './Select'

const SIZES = [10, 20, 50, 100]
const SIZE_OPTIONS = SIZES.map((s) => ({ value: String(s), label: String(s) }))

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  return pages.flatMap((p, i) => (i && p - pages[i - 1] > 1 ? ['…' as const, p] : [p]))
}

type Props = {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}

export function Pager({ page, pageSize, total, onPage, onPageSize }: Props) {
  if (total <= SIZES[0]) return null

  const pages = Math.ceil(total / pageSize)

  return (
    <nav className="pager" aria-label="Страницы">
      <div className="pager-size">
        <span className="pager-size-label">Строк на странице</span>
        <Select
          compact
          value={String(pageSize)}
          options={SIZE_OPTIONS}
          onChange={(v) => onPageSize(Number(v))}
        />
      </div>

      {pages > 1 && (
        <div className="pager-controls">
          <button
            type="button"
            className="pager-btn"
            disabled={page === 1}
            aria-label="Предыдущая страница"
            onClick={() => onPage(page - 1)}
          >
            ‹
          </button>

          {pageNumbers(page, pages).map((p, i) =>
            p === '…' ? (
              <span key={`dots-${i}`} className="pager-dots">
                …
              </span>
            ) : (
              <button
                type="button"
                key={p}
                aria-current={p === page ? 'page' : undefined}
                className={cx('pager-btn', p === page && 'active')}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            className="pager-btn"
            disabled={page === pages}
            aria-label="Следующая страница"
            onClick={() => onPage(page + 1)}
          >
            ›
          </button>
        </div>
      )}
    </nav>
  )
}
