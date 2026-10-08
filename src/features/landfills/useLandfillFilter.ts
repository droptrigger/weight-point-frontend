import { useCan } from '@/features/auth/permissions'

// Фильтр по полигону доступен только разработчику: остальным сервер и так отдаёт данные их полигона.
// Без права ключ landfillId не читается из ссылки, поэтому чужой landfillId в URL ничего не фильтрует
export function useLandfillFilter<K extends string>(filterKeys: readonly K[]) {
  const enabled = useCan('landfills.filter')

  return {
    enabled,
    filterKeys: enabled ? filterKeys : filterKeys.filter((key) => key !== 'landfillId'),
  }
}
