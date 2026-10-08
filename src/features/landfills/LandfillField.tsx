import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { Field } from '@/shared/ui/Form'
import { Select } from '@/shared/ui/Select'
import { useLandfillOptions } from './hooks'

type Props = { id: string; value: string; onChange: (value: string) => void; error?: string }

// Выбор полигона в формах. Рендерится только при праве landfills.assign (разработчик):
// остальные роли создают записи в своём полигоне, его подставляет сервер
export function LandfillField({ id, value, onChange, error }: Props) {
  const landfills = useLandfillOptions(value || undefined)

  return (
    <Field id={id} label="Полигон" error={error}>
      <Select
        id={id}
        value={value}
        {...remoteSelectProps(landfills, 'Выберите полигон')}
        invalid={Boolean(error)}
        onChange={onChange}
      />
    </Field>
  )
}
