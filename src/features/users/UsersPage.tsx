import { useCan } from '@/features/auth/permissions'
import { useInactiveFilter } from '@/features/auth/useInactiveFilter'
import { LandfillFilter } from '@/features/landfills/LandfillFilter'
import { useLandfillFilter } from '@/features/landfills/useLandfillFilter'
import { toOptions } from '@/shared/lib/options'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useListParams } from '@/shared/lib/useListParams'
import { AddButton } from '@/shared/ui/AddButton'
import { InactiveToggle } from '@/shared/ui/InactiveToggle'
import { ListPage } from '@/shared/ui/ListPage'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Select } from '@/shared/ui/Select'
import { USER_COLUMNS } from './columns'
import { useUsers } from './hooks'
import { ROLES } from './roles'
import { UserFormModal } from './UserFormModal'
import { UserRow } from './UsersTable'

const FILTERS = ['landfillId', 'roleId', 'inactive'] as const

export function UsersPage() {
  const landfillFilter = useLandfillFilter(FILTERS)
  const inactiveFilter = useInactiveFilter(landfillFilter.filterKeys)
  const list = useListParams(inactiveFilter.filterKeys)
  const { roleId } = list.filters
  const landfillId = landfillFilter.enabled ? list.filters.landfillId : undefined
  const canManage = useCan('users.manage')
  const includeInactive = inactiveFilter.enabled && list.filters.inactive === 'true'
  const create = useDisclosure()

  const query = useUsers({
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    includeInactive,
    landfillId,
    roleId,
  })

  return (
    <>
      <ListPage
        title="Пользователи"
        list={list}
        query={query}
        toolbar={
          inactiveFilter.enabled && (
            <InactiveToggle
              checked={includeInactive}
              onChange={(checked) => list.setFilter('inactive', checked ? 'true' : '')}
            />
          )
        }
        columns={USER_COLUMNS}
        tableClass="list-users"
        actions={canManage && <AddButton label="Добавить пользователя" onClick={create.show} />}
        filters={
          <>
            <SearchInput
              span={landfillFilter.enabled ? 2 : 3}
              value={list.search}
              onChange={list.setSearch}
              placeholder="Имя или email"
            />
            {landfillFilter.enabled && (
              <LandfillFilter
                value={landfillId ?? ''}
                onChange={(value) => list.setFilter('landfillId', value)}
              />
            )}
            <Select
              filter
              value={roleId}
              options={toOptions('Все роли', ROLES)}
              onChange={(value) => list.setFilter('roleId', value)}
            />
          </>
        }
        renderRow={(user) => <UserRow key={user.id} user={user} />}
      />
      <UserFormModal open={create.open} onClose={create.hide} />
    </>
  )
}
