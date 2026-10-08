import { useSearchParams } from 'react-router-dom'
import { useLandfillOptions } from './hooks'

// Разработчик выбирает полигон; пока выбора нет, показывается первый полигон из списка.
// Выбор хранится в ссылке, чтобы «назад» и обновление страницы его не сбрасывали
export function usePickedLandfill(enabled: boolean) {
  const [params, setParams] = useSearchParams()
  const picked = params.get('landfillId') ?? ''
  const options = useLandfillOptions(picked || undefined, enabled)
  const landfillId = picked || (options.options[0]?.value ?? '')
  const option =
    options.options.find((o) => o.value === landfillId) ??
    (options.current?.value === landfillId ? options.current : undefined)

  const pick = (id: string) => setParams(id ? { landfillId: id } : {}, { replace: true })

  return { options, landfillId, name: option?.label, pick }
}
