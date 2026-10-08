import { useParams } from 'react-router-dom'
import { Recycle } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { LandfillInfoRow } from '@/features/landfills/LandfillInfoRow'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { restoreAction } from '@/shared/lib/restoreAction'
import { useDeleteFlow } from '@/shared/lib/useDeleteFlow'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { WarningBadge } from '@/shared/ui/Badges'
import { DetailPage } from '@/shared/ui/DetailPage'
import { DeleteDialog, EntityActions } from '@/shared/ui/EntityActions'
import { EntityHead, InfoList, InfoRow } from '@/shared/ui/InfoCard'
import { EntityCardSkeleton } from '@/shared/ui/Skeleton'
import { formatWasteCode } from './code'
import { useDeleteWasteType, useRestoreWasteType, useWasteType } from './hooks'
import { isLicenseExpired, LICENSE_EXPIRED } from './license'
import { WasteTypeAnalytics } from './WasteTypeAnalytics'
import { WasteTypeFormModal } from './WasteTypeFormModal'

export function WasteTypePage() {
  const id = useParams().id ?? ''
  const canEdit = useCan('reference.edit')
  const query = useWasteType(id)
  const edit = useDisclosure()
  const remove = useDeleteFlow(useDeleteWasteType(), '/waste-types')
  const canRestore = useCan('inactive.restore')
  const restore = useRestoreWasteType()

  return (
    <DetailPage
      title="Вид отходов"
      backTo="/waste-types"
      query={query}
      notFound="Вид отходов не найден"
      failed="Не удалось загрузить вид отходов"
      skeleton={
        <div className="detail-layout">
          <EntityCardSkeleton />
          <WasteTypeAnalytics wasteTypeId={id} enabled={false} />
        </div>
      }
    >
      {(item) => (
        <>
          <div className="detail-layout">
            <section className="info-card entity-card">
              <EntityHead
                icon={Recycle}
                label="Вид отходов"
                title={item.name}
                aside={
                  isLicenseExpired(item.validUntil) && <WarningBadge label={LICENSE_EXPIRED} />
                }
              />

              <InfoList>
                <InfoRow label="Код">{formatWasteCode(item.code)}</InfoRow>
                <LandfillInfoRow landfillId={item.landfillId} />
                <InfoRow label="Отправка в ФГИС УТКО">
                  {item.requiresSending ? 'Нужна' : 'Не нужна'}
                </InfoRow>
                <InfoRow label="Номер лицензии">{item.licenseNumber}</InfoRow>
                <InfoRow label="Лицензия действует до">
                  <span className={isLicenseExpired(item.validUntil) ? 'text-danger' : undefined}>
                    {item.validUntil ? formatDate(item.validUntil) : 'Бессрочно'}
                  </span>
                </InfoRow>
                <InfoRow label="Добавлен">{formatDateTime(item.createdAt)}</InfoRow>
                <InfoRow label="ID">{item.id}</InfoRow>
              </InfoList>

              {canEdit && (
                <EntityActions
                  onEdit={edit.show}
                  onDelete={remove.show}
                  inactive={!item.isActive}
                  restore={restoreAction(restore, item.id, canRestore && !item.isActive)}
                />
              )}
            </section>

            <WasteTypeAnalytics wasteTypeId={item.id} />
          </div>

          <WasteTypeFormModal open={edit.open} item={item} onClose={edit.hide} />
          <DeleteDialog flow={remove} id={item.id} name={item.name} />
        </>
      )}
    </DetailPage>
  )
}
