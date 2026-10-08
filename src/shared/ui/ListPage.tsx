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

// Q — строки с сервера, T — строки таблицы. Обычно это одно и то же, но список может показывать и строки,
// которых в ответе уже нет (items), например отчёт, который только что принял другой пользователь
type Props<Q, T = Q> = {
  title: string
  actions?: ReactNode
  top?: ReactNode // блок над фильтрами (например, статистика)
  toolbar?: ReactNode // элементы рядом со счётчиком (например, «Показывать неактивные»)
  above?: ReactNode // блок над таблицей (например, действия с выделенными строками)
  filters: ReactNode
  list: ListState
  query: UseQueryResult<Paged<Q>>
  items?: T[] // строки вместо query.data.items
  columns: ReactNode[] // заголовки таблицы, у колонки со стрелкой пустая строка
  tableClass: string // раскладка колонок, например list-vehicles
  renderRow: (item: T) => ReactNode // возвращает строку с key
}

export function ListPage<Q, T = Q>({
  title,
  actions,
  top,
  toolbar,
  above,
  filters,
  list,
  query,
  items,
  columns,
  tableClass,
  renderRow,
}: Props<Q, T>) {
  const { data, isPending, isError, isFetching, isPlaceholderData } = query
  // Спиннер — только пока на месте нового списка показан старый (смена страницы или фильтров).
  // Фоновое обновление по событиям сервера не мигает спиннером каждую секунду
  const refreshing = isFetching && isPlaceholderData
  // Без items строки таблицы и есть строки ответа (T совпадает с Q)
  const rows = items ?? (data?.items as T[] | undefined)

  const emptyText = isError
    ? 'Не удалось загрузить данные'
    : rows?.length === 0
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
              rows?.map(renderRow)
            )}
          </div>
        </section>
      </div>
    </>
  )
}
