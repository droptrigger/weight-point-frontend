import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { Select } from '@/shared/ui/Select'
import { useLandfillOptions } from './hooks'

type Props = { value: string; onChange: (value: string) => void }

// Фильтр списков по полигону. Рендерится только при праве landfills.filter (см. useLandfillFilter)
export function LandfillFilter({ value, onChange }: Props) {
  const landfills = useLandfillOptions(value || undefined)
  return (
    <Select
      filter
      value={value}
      {...remoteSelectProps(landfills, 'Все полигоны')}
      onChange={onChange}
    />
  )
}
