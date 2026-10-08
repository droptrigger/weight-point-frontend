import { ChevronRight } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { EntityLink } from '@/shared/ui/EntityLink'
import { InfoRow } from '@/shared/ui/InfoCard'
import { useLandfill } from './hooks'

// Строка «Полигон» в карточке записи справочника. Нужна только разработчику:
// остальные видят записи только своего полигона
export function LandfillInfoRow({ landfillId }: { landfillId: string }) {
  const canSee = useCan('landfills.view')
  const landfill = useLandfill(landfillId, canSee)
  if (!canSee) return null

  const name = landfill.data?.name

  return (
    <InfoRow label="Полигон">
      <EntityLink className="info-link" to={`/landfills/${landfillId}`}>
        {name ?? 'Открыть'}
        <ChevronRight className="icon" />
      </EntityLink>
    </InfoRow>
  )
}
