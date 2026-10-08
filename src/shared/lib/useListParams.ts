import { useSearchParams } from 'react-router-dom'

const DEFAULT_PAGE_SIZE = 20

// Страница, размер, поиск и фильтры живут в URL: работают «назад» и ссылки на отфильтрованный список
export function useListParams<K extends string = never>(filterKeys: readonly K[] = []) {
  const [params, setParams] = useSearchParams()

  const page = Math.max(1, Number(params.get('page')) || 1)
  const pageSize = Number(params.get('pageSize')) || DEFAULT_PAGE_SIZE
  const search = params.get('search') ?? ''
  const filters = Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ''])) as Record<
    K,
    string
  >
  const hasFilters = Boolean(search) || Object.values<string>(filters).some(Boolean)

  const update = (patch: Record<string, string | number>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value === '') next.delete(key)
          else next.set(key, String(value))
        }
        return next
      },
      { replace: true },
    )

  return {
    page,
    pageSize,
    search,
    filters,
    hasFilters,
    setPage: (p: number) => update({ page: p }),
    setPageSize: (size: number) => update({ pageSize: size, page: 1 }),
    setSearch: (s: string) => update({ search: s, page: 1 }),
    setFilter: (key: K, value: string) => update({ [key]: value, page: 1 }),
    setFilters: (patch: Partial<Record<K, string>>) =>
      update({ ...(patch as Record<string, string>), page: 1 }),
    reset: () =>
      update({ search: '', page: '', ...Object.fromEntries(filterKeys.map((k) => [k, ''])) }),
  }
}

export type ListParamsState = ReturnType<typeof useListParams>
