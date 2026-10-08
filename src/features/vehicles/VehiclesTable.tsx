import { ChevronRight } from 'lucide-react'
import { rowClass } from '@/shared/lib/rowClass'
import { InactiveBadge, PlateNumber } from '@/shared/ui/Badges'
import { EntityLink } from '@/shared/ui/EntityLink'
import { StaticTable } from '@/shared/ui/StaticTable'
import type { Vehicle } from './api'
import { VEHICLE_COLUMNS } from './columns'

export function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  return (
    <EntityLink to={`/vehicles/${vehicle.id}`} className={rowClass(vehicle.isActive)}>
      <div className="plate-cell">
        <PlateNumber number={vehicle.plateNumber} region={vehicle.regionCode} />
      </div>
      {/* Пометка в строку с маркой, а не под номером: высота строки не меняется */}
      <div className="cell cell-name name-with-badge" data-label="Марка">
        <span>{vehicle.make?.name ?? '—'}</span>
        {vehicle.isActive === false && <InactiveBadge label="Неактивна" />}
      </div>
      <div className="cell cell-landfill" data-label="Перевозчик">
        {vehicle.carrier?.name ?? '—'}
      </div>
      <div className="cell-arrow">
        <ChevronRight className="icon" />
      </div>
    </EntityLink>
  )
}

export function VehiclesTable({ items }: { items: Vehicle[] }) {
  return (
    <StaticTable
      className="list-vehicles"
      columns={VEHICLE_COLUMNS}
      items={items}
      empty="Машин нет"
      renderRow={(vehicle) => <VehicleRow key={vehicle.id} vehicle={vehicle} />}
    />
  )
}
