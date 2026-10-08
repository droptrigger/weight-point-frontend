import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'

type Props<T> = {
  className: string // раскладка колонок, как у ListPage (например, list-vehicles)
  columns: ReactNode[]
  items: T[]
  empty: string // «Машин нет»
  renderRow: (item: T) => ReactNode // возвращает строку с key
}

// Таблица без фильтров и страниц, встроенная в страницу записи (машины перевозчика, сотрудники полигона)
export function StaticTable<T>({ className, columns, items, empty, renderRow }: Props<T>) {
  return (
    <section className={cx('report-card', className)}>
      <TableHead columns={columns} />
      {items.length === 0 ? <div className="empty">{empty}</div> : items.map(renderRow)}
    </section>
  )
}

// Строка заголовков таблицы: общая для ListPage и StaticTable
export function TableHead({ columns }: { columns: ReactNode[] }) {
  return (
    <div className="report-head">
      {columns.map((column, index) => (
        <div key={index}>{column}</div>
      ))}
    </div>
  )
}
