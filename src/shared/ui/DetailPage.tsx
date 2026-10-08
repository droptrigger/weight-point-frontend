import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { UseQueryResult } from '@tanstack/react-query'
import { ArrowLeft, CloudAlert, RotateCw, SearchX } from 'lucide-react'
import { isNotFound } from '@/shared/api/http'
import { useBackTarget } from '@/shared/lib/backNavigation'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'
import { EntityCardSkeleton } from './Skeleton'

type Props<T> = {
  title: string
  backTo: string
  query: UseQueryResult<T>
  notFound: string // «Перевозчик не найден»
  failed: string // «Не удалось загрузить перевозчика»
  headerActions?: (data: T) => ReactNode
  skeleton?: ReactNode // заглушка на время загрузки, по умолчанию карточка сущности
  children: (data: T) => ReactNode
}

// Шапка, заглушка загрузки и ошибки. Хуки страницы вызываются выше, в самом компоненте страницы
export function DetailPage<T>({
  title,
  backTo,
  query,
  notFound,
  failed,
  headerActions,
  skeleton = <EntityCardSkeleton />,
  children,
}: Props<T>) {
  const { data, isPending, error } = query
  const back = useBackTarget(backTo)

  const backLink = (
    <Link className="btn btn--ghost" to={back.to} state={back.state}>
      <ArrowLeft className="icon" />
      Вернуться назад
    </Link>
  )

  return (
    <>
      <PageHeader title={title} backTo={backTo} actions={data && headerActions?.(data)} />

      <div className="content-body">
        {isPending ? (
          skeleton
        ) : data ? (
          children(data)
        ) : isNotFound(error) ? (
          <EmptyState
            icon={SearchX}
            code="404"
            title={notFound}
            description="Возможно, запись удалена, у вас нет к ней доступа или ссылка устарела."
            actions={backLink}
          />
        ) : (
          <EmptyState
            icon={CloudAlert}
            tone="danger"
            title={failed}
            description="Проверьте подключение к сети и попробуйте ещё раз."
            actions={
              <>
                <Button onClick={() => query.refetch()} loading={query.isFetching}>
                  {!query.isFetching && <RotateCw className="icon" />}
                  Повторить
                </Button>
                {backLink}
              </>
            }
          />
        )}
      </div>
    </>
  )
}
