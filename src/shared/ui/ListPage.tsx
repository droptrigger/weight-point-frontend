import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Paged } from '@/shared/api/http'
import { PageHeader } from './PageHeader'
import { Pager } from './Pager'
import { Skeleton, TableSkeletonRows } from './Skeleton'
import { Spinner } from './Spinner'
import { TableHead } from './StaticTable'

type ListState = {
  page: number
  pageSize: number
  hasFilters: boolean
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  reset: () => void
}

type Props<T> = {
  title: string
  actions?: ReactNode
  top?: ReactNode // блок над фильтрами (например, статистика)
  toolbar?: ReactNode // элементы рядом со счётчиком (например, «Показывать неактивные»)
  above?: ReactNode // блок над таблицей (например, действия с выделенными строками)
  filters: ReactNode
  list: ListState
  query: UseQueryResult<Paged<T>>
  columns: ReactNode[] // заголовки таблицы, у колонки со стрелкой пустая строка
  tableClass: string // раскладка колонок, например list-vehicles
  renderRow: (item: T) => ReactNode // возвращает строку с key
}

export function ListPage<T>({
  title,
  actions,
  top,
  toolbar,
  above,
  filters,
  list,
  query,
  columns,
  tableClass,
  renderRow,
}: Props<T>) {
  const { data, isPending, isError, isFetching } = query
  const refreshing = isFetching && !isPending

  const emptyText = isError
    ? 'Не удалось загрузить данные'
    : data?.items.length === 0
      ? 'Ничего не найдено'
      : null

  return (
    <>
      <PageHeader title={title} actions={actions} />

      <div className="content-body">
        {top}

        <section className="filters" aria-label="Фильтры">
          {filters}
        </section>

        <div className="list-toolbar">
          <div className="list-meta">
            <span className="count">
              {data ? `Найдено: ${data.totalCount}` : isPending && <Skeleton width={96} />}
            </span>
            {toolbar}
            {refreshing && <Spinner size="sm" />}
            {list.hasFilters && (
              <button type="button" className="reset" onClick={list.reset}>
                Сбросить фильтры
              </button>
            )}
          </div>

          {data && (
            <Pager
              page={list.page}
              pageSize={list.pageSize}
              total={data.totalCount}
              onPage={list.setPage}
              onPageSize={list.setPageSize}
            />
          )}
        </div>

        {above}

        <section className={`report-card ${tableClass}`}>
          <TableHead columns={columns} />

          <div className={refreshing ? 'loading' : undefined}>
            {isPending ? (
              <TableSkeletonRows columns={columns} rows={Math.min(list.pageSize, 8)} />
            ) : emptyText ? (
              <div className="empty">{emptyText}</div>
            ) : (
              data?.items.map(renderRow)
            )}
          </div>
        </section>
      </div>
    </>
  )
}
