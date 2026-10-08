import { useState } from 'react'
import { useInfiniteQuery, useQuery, type QueryKey } from '@tanstack/react-query'
import type { Paged } from '@/shared/api/http'
import type { Option } from './options'
import { useDebounce } from './useDebounce'

// Справочник в выпадающем списке грузится страницами по мере прокрутки, поиск — на сервере
export const OPTIONS_PAGE_SIZE = 50

export type OptionsPageParams = { page: number; pageSize: number; search: string }

type Config<T> = {
  key: QueryKey // внутри ключа `all` сущности: её мутации сбрасывают и списки в выпадающих меню
  fetchPage: (p: OptionsPageParams) => Promise<Paged<T>>
  toOption: (item: T) => Option
  value?: string // выбранное значение: если его нет среди загруженных, подпись приходит из fetchOne
  fetchOne?: (id: string) => Promise<T>
  enabled?: boolean
}

export type RemoteOptions = {
  options: Option[]
  current?: Option // выбранная запись, которой нет на загруженных страницах
  search: string
  setSearch: (search: string) => void
  loading: boolean // первая страница ещё не пришла
  searching: boolean // идёт запрос по новому поисковому тексту
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
}

export function useRemoteOptions<T>({
  key,
  fetchPage,
  toOption,
  value,
  fetchOne,
  enabled = true,
}: Config<T>): RemoteOptions {
  const [search, setSearch] = useState('')
  const term = useDebounce(search.trim(), 300)

  const prefix = JSON.stringify(key)
  const pages = useInfiniteQuery({
    queryKey: [...key, 'options', term],
    queryFn: ({ pageParam }) =>
      fetchPage({ page: pageParam, pageSize: OPTIONS_PAGE_SIZE, search: term }),
    initialPageParam: 1,
    // Счёт идёт по загруженным записям, потому что сервер может урезать размер страницы
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.items.length, 0)
      return last.items.length > 0 && loaded < last.totalCount ? all.length + 1 : undefined
    },
    // Во время поиска остаются прежние варианты, чтобы список не мигал. Другой полигон — другой
    // справочник, поэтому там прежние варианты не подходят и список ждёт загрузки
    placeholderData: (prev, prevQuery) =>
      prevQuery && JSON.stringify(prevQuery.queryKey.slice(0, key.length)) === prefix
        ? prev
        : undefined,
    enabled,
  })

  const options = pages.data?.pages.flatMap((p) => p.items.map(toOption)) ?? []
  // Подпись выбранной записи догружается, только если её не оказалось в первых страницах без поиска
  const missing =
    Boolean(value) && !term && !pages.isPending && !options.some((o) => o.value === value)
  const one = useQuery({
    queryKey: [...key, 'option', value],
    queryFn: () => fetchOne!(value!),
    enabled: enabled && missing && Boolean(fetchOne),
  })

  return {
    options,
    current: one.data && value ? { ...toOption(one.data), value } : undefined,
    search,
    setSearch,
    loading: enabled && pages.isPending,
    searching: search.trim() !== term || (pages.isFetching && !pages.isFetchingNextPage),
    hasMore: pages.hasNextPage,
    loadingMore: pages.isFetchingNextPage,
    loadMore: () => void pages.fetchNextPage(),
  }
}

// Пропсы для Select: пустой пункт («Выберите …», «Все …») показывается, пока не идёт поиск
export const remoteSelectProps = (remote: RemoteOptions, emptyLabel: string) => ({
  options: remote.search.trim()
    ? remote.options
    : [{ value: '', label: emptyLabel }, ...remote.options],
  current: remote.current,
  loading: remote.loading,
  search: remote.search,
  onSearch: remote.setSearch,
  searching: remote.searching,
  hasMore: remote.hasMore,
  loadingMore: remote.loadingMore,
  onLoadMore: remote.loadMore,
})
