import { useCan } from '@/features/auth/permissions'
import { useInactiveFilter } from '@/features/auth/useInactiveFilter'
import { useCarrierOptions } from '@/features/carriers/hooks'
import { LandfillFilter } from '@/features/landfills/LandfillFilter'
import { useLandfillFilter } from '@/features/landfills/useLandfillFilter'
import { useMakeOptions } from '@/features/vehicle-makes/hooks'
import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useListParams } from '@/shared/lib/useListParams'
import { AddButton } from '@/shared/ui/AddButton'
import { InactiveToggle } from '@/shared/ui/InactiveToggle'
import { ListPage } from '@/shared/ui/ListPage'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Select } from '@/shared/ui/Select'
import { VEHICLE_COLUMNS } from './columns'
import { useVehicles } from './hooks'
import { VehicleFormModal } from './VehicleFormModal'
import { VehicleRow } from './VehiclesTable'

const FILTERS = ['landfillId', 'makeId', 'carrierId', 'inactive'] as const

export function VehiclesPage() {
  const landfillFilter = useLandfillFilter(FILTERS)
  const inactiveFilter = useInactiveFilter(landfillFilter.filterKeys)
  const list = useListParams(inactiveFilter.filterKeys)
  const { makeId, carrierId } = list.filters
  const landfillId = landfillFilter.enabled ? list.filters.landfillId : undefined
  const canEdit = useCan('reference.edit')
  const includeInactive = inactiveFilter.enabled && list.filters.inactive === 'true'
  const create = useDisclosure()

  const query = useVehicles({
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    includeInactive,
    landfillId,
    makeId,
    carrierId,
  })
  // Для разработчика, выбравшего полигон, марки и перевозчики ограничены этим полигоном
  const makes = useMakeOptions(landfillId || undefined, makeId || undefined)
  const carriers = useCarrierOptions(landfillId || undefined, carrierId || undefined)

  return (
    <>
      <ListPage
        title="Машины"
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
        columns={VEHICLE_COLUMNS}
        tableClass="list-vehicles"
        actions={canEdit && <AddButton label="Добавить машину" onClick={create.show} />}
        filters={
          <>
            <SearchInput
              span={landfillFilter.enabled ? 1 : 2}
              value={list.search}
              onChange={list.setSearch}
              placeholder="Номер машины"
            />
            {landfillFilter.enabled && (
              <LandfillFilter
                value={landfillId ?? ''}
                onChange={(value) => list.setFilter('landfillId', value)}
              />
            )}
            <Select
              filter
              value={makeId}
              {...remoteSelectProps(makes, 'Все марки')}
              onChange={(value) => list.setFilter('makeId', value)}
            />
            <Select
              filter
              value={carrierId}
              {...remoteSelectProps(carriers, 'Все перевозчики')}
              onChange={(value) => list.setFilter('carrierId', value)}
            />
          </>
        }
        renderRow={(vehicle) => <VehicleRow key={vehicle.id} vehicle={vehicle} />}
      />
      <VehicleFormModal open={create.open} onClose={create.hide} />
    </>
  )
}
