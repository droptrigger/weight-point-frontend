import { ChevronRight } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { useInactiveFilter } from '@/features/auth/useInactiveFilter'
import { LandfillFilter } from '@/features/landfills/LandfillFilter'
import { useLandfillFilter } from '@/features/landfills/useLandfillFilter'
import { rowClass } from '@/shared/lib/rowClass'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useListParams } from '@/shared/lib/useListParams'
import { AddButton } from '@/shared/ui/AddButton'
import { InactiveBadge } from '@/shared/ui/Badges'
import { EntityLink } from '@/shared/ui/EntityLink'
import { InactiveToggle } from '@/shared/ui/InactiveToggle'
import { ListPage } from '@/shared/ui/ListPage'
import { SearchInput } from '@/shared/ui/SearchInput'
import { CarrierFormModal } from './CarrierFormModal'
import { useCarriers } from './hooks'

const FILTERS = ['landfillId', 'inactive'] as const

export function CarriersPage() {
  const landfillFilter = useLandfillFilter(FILTERS)
  const inactiveFilter = useInactiveFilter(landfillFilter.filterKeys)
  const list = useListParams(inactiveFilter.filterKeys)
  const landfillId = landfillFilter.enabled ? list.filters.landfillId : undefined
  const canEdit = useCan('reference.edit')
  const includeInactive = inactiveFilter.enabled && list.filters.inactive === 'true'
  const create = useDisclosure()
  const query = useCarriers({
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    includeInactive,
    landfillId,
  })

  return (
    <>
      <ListPage
        title="Перевозчики"
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
        columns={['Название', '']}
        tableClass="list-carriers"
        actions={canEdit && <AddButton label="Добавить перевозчика" onClick={create.show} />}
        filters={
          <>
            <SearchInput
              span={landfillFilter.enabled ? 3 : 4}
              value={list.search}
              onChange={list.setSearch}
              placeholder="Название перевозчика"
            />
            {landfillFilter.enabled && (
              <LandfillFilter
                value={landfillId ?? ''}
                onChange={(value) => list.setFilter('landfillId', value)}
              />
            )}
          </>
        }
        renderRow={(carrier) => (
          <EntityLink
            key={carrier.id}
            to={`/carriers/${carrier.id}`}
            className={rowClass(carrier.isActive)}
          >
            <div className="cell cell-name name-with-badge" data-label="Название">
              <span>{carrier.name}</span>
              {carrier.isActive === false && <InactiveBadge />}
            </div>
            <div className="cell-arrow">
              <ChevronRight className="icon" />
            </div>
          </EntityLink>
        )}
      />
      <CarrierFormModal open={create.open} onClose={create.hide} />
    </>
  )
}
