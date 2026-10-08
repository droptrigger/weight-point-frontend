import { ChevronRight } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { useInactiveFilter } from '@/features/auth/useInactiveFilter'
import { LandfillFilter } from '@/features/landfills/LandfillFilter'
import { useLandfillFilter } from '@/features/landfills/useLandfillFilter'
import { cx } from '@/shared/lib/cx'
import { formatDate } from '@/shared/lib/format'
import { rowClass } from '@/shared/lib/rowClass'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useListParams } from '@/shared/lib/useListParams'
import { AddButton } from '@/shared/ui/AddButton'
import { InactiveBadge } from '@/shared/ui/Badges'
import { EntityLink } from '@/shared/ui/EntityLink'
import { InactiveToggle } from '@/shared/ui/InactiveToggle'
import { ListPage } from '@/shared/ui/ListPage'
import { SearchInput } from '@/shared/ui/SearchInput'
import { formatWasteCode } from './code'
import { useWasteTypes } from './hooks'
import { isLicenseExpired } from './license'
import { WasteTypeFormModal } from './WasteTypeFormModal'

const FILTERS = ['landfillId', 'inactive'] as const

export function WasteTypesPage() {
  const landfillFilter = useLandfillFilter(FILTERS)
  const inactiveFilter = useInactiveFilter(landfillFilter.filterKeys)
  const list = useListParams(inactiveFilter.filterKeys)
  const landfillId = landfillFilter.enabled ? list.filters.landfillId : undefined
  const canEdit = useCan('reference.edit')
  const includeInactive = inactiveFilter.enabled && list.filters.inactive === 'true'
  const create = useDisclosure()
  const query = useWasteTypes({
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    includeInactive,
    landfillId,
  })

  return (
    <>
      <ListPage
        title="Виды отходов"
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
        columns={['Код', 'Название', 'Лицензия до', '']}
        tableClass="list-waste"
        actions={canEdit && <AddButton label="Добавить вид отходов" onClick={create.show} />}
        filters={
          <>
            <SearchInput
              span={landfillFilter.enabled ? 3 : 4}
              value={list.search}
              onChange={list.setSearch}
              placeholder="Код или название"
            />
            {landfillFilter.enabled && (
              <LandfillFilter
                value={landfillId ?? ''}
                onChange={(value) => list.setFilter('landfillId', value)}
              />
            )}
          </>
        }
        renderRow={(item) => (
          <EntityLink
            key={item.id}
            to={`/waste-types/${item.id}`}
            className={rowClass(item.isActive)}
          >
            <div className="cell cell-num" data-label="Код">
              {formatWasteCode(item.code)}
            </div>
            <div className="cell cell-name name-with-badge" data-label="Название">
              <span>{item.name}</span>
              {!item.requiresSending && <InactiveBadge label="Без отправки в ФГИС" />}
              {item.isActive === false && <InactiveBadge />}
            </div>
            {/* Истёкшая лицензия — красная дата, без отдельной пометки */}
            <div
              className={cx('cell', isLicenseExpired(item.validUntil) && 'text-danger')}
              data-label="Лицензия до"
            >
              {item.validUntil ? formatDate(item.validUntil) : 'Бессрочно'}
            </div>
            <div className="cell-arrow">
              <ChevronRight className="icon" />
            </div>
          </EntityLink>
        )}
      />
      <WasteTypeFormModal open={create.open} onClose={create.hide} />
    </>
  )
}
