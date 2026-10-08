import { ChevronRight } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { useInactiveFilter } from '@/features/auth/useInactiveFilter'
import { rowClass } from '@/shared/lib/rowClass'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useListParams } from '@/shared/lib/useListParams'
import { AddButton } from '@/shared/ui/AddButton'
import { InactiveBadge } from '@/shared/ui/Badges'
import { EntityLink } from '@/shared/ui/EntityLink'
import { InactiveToggle } from '@/shared/ui/InactiveToggle'
import { ListPage } from '@/shared/ui/ListPage'
import { SearchInput } from '@/shared/ui/SearchInput'
import { coordsLabel } from './api'
import { useLandfills } from './hooks'
import { LandfillFormModal } from './LandfillFormModal'

const FILTERS = ['inactive'] as const

export function LandfillsPage() {
  const inactiveFilter = useInactiveFilter(FILTERS)
  const list = useListParams(inactiveFilter.filterKeys)
  const canCreate = useCan('landfills.manage')
  const includeInactive = inactiveFilter.enabled && list.filters.inactive === 'true'
  const create = useDisclosure()
  const query = useLandfills({
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    includeInactive,
  })

  return (
    <>
      <ListPage
        title="Полигоны"
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
        columns={['Название', 'Координаты', '']}
        tableClass="list-landfills"
        actions={canCreate && <AddButton label="Добавить полигон" onClick={create.show} />}
        filters={
          <SearchInput
            span={4}
            value={list.search}
            onChange={list.setSearch}
            placeholder="Название полигона"
          />
        }
        renderRow={(landfill) => (
          <EntityLink
            key={landfill.id}
            to={`/landfills/${landfill.id}`}
            className={rowClass(landfill.isActive)}
          >
            <div className="cell cell-name name-with-badge" data-label="Название">
              <span>{landfill.name}</span>
              {landfill.isActive === false && <InactiveBadge />}
            </div>
            <div className="cell cell-time" data-label="Координаты">
              {coordsLabel(landfill)}
            </div>
            <div className="cell-arrow">
              <ChevronRight className="icon" />
            </div>
          </EntityLink>
        )}
      />
      <LandfillFormModal open={create.open} onClose={create.hide} />
    </>
  )
}
