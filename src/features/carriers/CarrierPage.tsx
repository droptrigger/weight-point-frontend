import { useParams } from 'react-router-dom'
import { useCan } from '@/features/auth/permissions'
import { LandfillInfoRow } from '@/features/landfills/LandfillInfoRow'
import { VehiclesTable } from '@/features/vehicles/VehiclesTable'
import { formatDateTime } from '@/shared/lib/format'
import { restoreAction } from '@/shared/lib/restoreAction'
import { useDeleteFlow } from '@/shared/lib/useDeleteFlow'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { DetailPage } from '@/shared/ui/DetailPage'
import { DeleteDialog, EntityActions } from '@/shared/ui/EntityActions'
import { HandTruck } from '@/shared/ui/icons'
import { EntityHead, InfoList, InfoRow } from '@/shared/ui/InfoCard'
import { EntityCardSkeleton } from '@/shared/ui/Skeleton'
import { CarrierAnalytics } from './CarrierAnalytics'
import { CarrierFormModal } from './CarrierFormModal'
import { useCarrier, useDeleteCarrier, useRestoreCarrier } from './hooks'

export function CarrierPage() {
  const id = useParams().id ?? ''
  const canEdit = useCan('reference.edit')
  const query = useCarrier(id)
  const edit = useDisclosure()
  const remove = useDeleteFlow(useDeleteCarrier(), '/carriers')
  const canRestore = useCan('inactive.restore')
  const restore = useRestoreCarrier()

  return (
    <DetailPage
      title="Перевозчик"
      backTo="/carriers"
      query={query}
      notFound="Перевозчик не найден"
      failed="Не удалось загрузить перевозчика"
      skeleton={
        <div className="detail-layout">
          <EntityCardSkeleton />
          <CarrierAnalytics carrierId={id} enabled={false} />
        </div>
      }
    >
      {(carrier) => (
        <>
          <div className="detail-layout">
            <section className="info-card entity-card">
              <EntityHead icon={HandTruck} label="Перевозчик" title={carrier.name} />

              <InfoList>
                <LandfillInfoRow landfillId={carrier.landfillId} />
                <InfoRow label="Добавлен">{formatDateTime(carrier.dateCreate)}</InfoRow>
                <InfoRow label="ID">{carrier.id}</InfoRow>
              </InfoList>

              {canEdit && (
                <EntityActions
                  onEdit={edit.show}
                  onDelete={remove.show}
                  inactive={!carrier.isActive}
                  restore={restoreAction(restore, carrier.id, canRestore && !carrier.isActive)}
                />
              )}
            </section>

            <CarrierAnalytics carrierId={carrier.id} />
          </div>

          <h2 className="section-title">Машины ({carrier.vehicles.length})</h2>
          <VehiclesTable items={carrier.vehicles} />

          <CarrierFormModal open={edit.open} carrier={carrier} onClose={edit.hide} />
          <DeleteDialog flow={remove} id={carrier.id} name={carrier.name} />
        </>
      )}
    </DetailPage>
  )
}
