import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { useMe } from '@/features/auth/hooks'
import { useCan, useOwnLandfillId } from '@/features/auth/permissions'
import { LandfillAnalytics } from '@/features/landfills/LandfillAnalytics'
import { LandfillNettoChart } from '@/features/landfills/LandfillNettoChart'
import { LandfillReportsCalendar } from '@/features/landfills/LandfillReportsCalendar'
import { usePickedLandfill } from '@/features/landfills/usePickedLandfill'
import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/Select'
import { Skeleton } from '@/shared/ui/Skeleton'

type Scope = { landfillId: string; name?: string; loading: boolean }

export function AnalyticsPage() {
  const canPick = useCan('landfills.filter')
  const ownLandfillId = useOwnLandfillId()
  const me = useMe()
  const picked = usePickedLandfill(canPick)

  const scope: Scope = canPick
    ? { landfillId: picked.landfillId, name: picked.name, loading: picked.options.loading }
    : { landfillId: ownLandfillId ?? '', name: me.data?.landfill?.name, loading: false }

  const noLandfill = !scope.loading && !scope.landfillId

  const picker = canPick && (
    <div className="analytics-picker">
      <Select
        filter
        value={picked.landfillId}
        {...remoteSelectProps(picked.options, 'Выберите полигон')}
        // Пустого пункта нет: аналитика всегда строится по одному полигону
        options={picked.options.options}
        onChange={picked.pick}
      />
    </div>
  )

  return (
    <>
      <PageHeader title="Аналитика" />

      <div className="content-body">
        {noLandfill ? (
          <EmptyState
            icon={MapPin}
            title={canPick ? 'Полигонов пока нет' : 'Полигон не назначен'}
            description={
              canPick
                ? 'Аналитика появится, когда будет добавлен хотя бы один полигон.'
                : 'Аналитика строится по полигону пользователя. Обратитесь к администратору.'
            }
          />
        ) : (
          <LandfillAnalyticsView {...scope} picker={picker} />
        )}
      </div>
    </>
  )
}

type ViewProps = Scope & { picker: ReactNode }

// Пока полигон не определён, графики остаются заглушками и запросы не уходят
function LandfillAnalyticsView({ landfillId, name, picker }: ViewProps) {
  const enabled = Boolean(landfillId)

  return (
    <div className="analytics">
      <div className="analytics-head">
        <div>
          <h2 className="analytics-title">
            {name ? `Полигон «${name}»` : <Skeleton width={220} />}
          </h2>
          <span className="analytics-sub">Аналитика за год</span>
        </div>
        {picker}
      </div>

      <LandfillAnalytics landfillId={landfillId} enabled={enabled} compact={false} />
      <LandfillNettoChart landfillId={landfillId} enabled={enabled} />
      <LandfillReportsCalendar landfillId={landfillId} enabled={enabled} />
    </div>
  )
}
