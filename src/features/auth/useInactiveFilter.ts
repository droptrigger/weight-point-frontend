import { useCan } from './permissions'

// Отметка «Показывать неактивные» доступна при праве inactive.view (администрация организации, разработчик).
// Без права ключ inactive не читается из ссылки, поэтому чужой inactive=true в URL ничего не меняет
export function useInactiveFilter<K extends string>(filterKeys: readonly K[]) {
  const enabled = useCan('inactive.view')

  return {
    enabled,
    filterKeys: enabled ? filterKeys : filterKeys.filter((key) => key !== 'inactive'),
  }
}
