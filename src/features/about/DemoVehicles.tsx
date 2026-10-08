import { useState } from 'react'
import { formatKg, formatNumber, plural } from '@/shared/lib/format'
import type { Option } from '@/shared/lib/options'
import { PlateNumber } from '@/shared/ui/Badges'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Select } from '@/shared/ui/Select'
import { DEMO_CARRIERS, DEMO_VEHICLES, matchesPlate } from './demoData'

const VEHICLE_FORMS: [string, string, string] = ['машина', 'машины', 'машин']

const CARRIER_OPTIONS: Option[] = [
  { value: '', label: 'Все перевозчики' },
  ...DEMO_CARRIERS.map((c) => ({ value: c.name, label: c.name })),
]

type Props = {
  carrier?: string // перевозчик, с карточки которого перешли
}

// Машины полигона: поиск по номеру и фильтр по перевозчику, отчёты и вес отходов за месяц
export function DemoVehicles({ carrier: initialCarrier = '' }: Props) {
  const [search, setSearch] = useState('')
  const [carrier, setCarrier] = useState(initialCarrier)

  const visible = DEMO_VEHICLES.filter(
    (v) => matchesPlate(search, v.plate, v.region) && (!carrier || v.carrier === carrier),
  )

  return (
    <div className="demo-vehicles">
      <div className="demo-page-head">
        <div>
          <h3>Машины</h3>
          <span className="demo-page-sub">
            {carrier ? `Перевозчик «${carrier}» · ` : ''}
            {plural(visible.length, VEHICLE_FORMS)}
          </span>
        </div>
      </div>

      <div className="filters demo-filters">
        <SearchInput span={2} value={search} onChange={setSearch} placeholder="Номер машины" />
        <div className="span-2">
          <Select filter value={carrier} options={CARRIER_OPTIONS} onChange={setCarrier} />
        </div>
      </div>

      <div className="demo-table" role="table" aria-label="Машины (демонстрация)">
        <div className="demo-row demo-row--vehicle demo-row-head" role="row">
          <span role="columnheader">Госномер</span>
          <span role="columnheader" className="demo-col-make">
            Марка
          </span>
          <span role="columnheader" className="demo-col-carrier">
            Перевозчик
          </span>
          <span role="columnheader" className="demo-col-num">
            Отчётов за месяц
          </span>
          <span role="columnheader" className="demo-col-num">
            Вес за месяц
          </span>
        </div>
        {visible.map((v) => (
          <div key={v.plate} className="demo-row demo-row--vehicle" role="row">
            <span role="cell" className="demo-plate">
              <PlateNumber number={v.plate} region={v.region} />
            </span>
            <span role="cell" className="demo-col-make">
              {v.make}
            </span>
            <span role="cell" className="demo-col-carrier">
              {v.carrier}
            </span>
            <span role="cell" className="demo-col-num">
              {formatNumber(v.monthReports)}
            </span>
            <span role="cell" className="demo-col-num">
              {formatKg(v.monthNettoKg)}
            </span>
          </div>
        ))}
        {!visible.length && (
          <div className="demo-empty">
            Ничего не найдено
            <Button
              variant="ghost"
              className="demo-reset"
              onClick={() => {
                setSearch('')
                setCarrier('')
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
