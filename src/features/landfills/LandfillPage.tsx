import { useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { UsersTable } from '@/features/users/UsersTable'
import { VehiclesTable } from '@/features/vehicles/VehiclesTable'
import { formatDateTime } from '@/shared/lib/format'
import { restoreAction } from '@/shared/lib/restoreAction'
import { useDeleteFlow } from '@/shared/lib/useDeleteFlow'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { DetailPage } from '@/shared/ui/DetailPage'
import { DeleteDialog, EntityActions } from '@/shared/ui/EntityActions'
import { EntityHead, InfoList, InfoRow } from '@/shared/ui/InfoCard'
import { EntityCardSkeleton } from '@/shared/ui/Skeleton'
import { hasCoords, mapUrl } from './api'
import { useDeleteLandfill, useLandfill, useRestoreLandfill } from './hooks'
import { LandfillAnalytics } from './LandfillAnalytics'
import { LandfillFormModal } from './LandfillFormModal'

export function LandfillPage() {
  const id = useParams().id ?? ''
  // Администрация правит свой полигон, удаляет и восстанавливает полигоны только разработчик
  const canEdit = useCan('landfills.edit')
  const canManage = useCan('landfills.manage')
  const canSeeLandfills = useCan('landfills.view')
  const query = useLandfill(id)
  const edit = useDisclosure()
  // Без раздела «Полигоны» назад ведёт к отчётам
  const backTo = canSeeLandfills ? '/landfills' : '/reports'
  const remove = useDeleteFlow(useDeleteLandfill(), backTo)
  const restore = useRestoreLandfill()

  return (
    <DetailPage
      title="Полигон"
      backTo={backTo}
      query={query}
      notFound="Полигон не найден"
      failed="Не удалось загрузить полигон"
      skeleton={
        <div className="detail-layout">
          <EntityCardSkeleton />
          <LandfillAnalytics landfillId={id} enabled={false} />
        </div>
      }
    >
      {(landfill) => (
        <>
          <div className="detail-layout">
            <section className="info-card entity-card">
              <EntityHead icon={MapPin} label="Полигон" title={landfill.name} />

              <InfoList>
                <InfoRow label="Координаты">
                  {hasCoords(landfill) ? (
                    <a
                      className="info-link"
                      href={mapUrl(landfill)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {landfill.latitude}, {landfill.longitude}
                    </a>
                  ) : (
                    'Не указаны'
                  )}
                </InfoRow>
                <InfoRow label="Добавлен">{formatDateTime(landfill.createdAt)}</InfoRow>
                <InfoRow label="ID">{landfill.id}</InfoRow>
              </InfoList>

              {hasCoords(landfill) && (
                <a
                  className="btn-primary"
                  href={mapUrl(landfill)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть на карте
                </a>
              )}

              {canEdit && (
                <EntityActions
                  onEdit={edit.show}
                  onDelete={canManage ? remove.show : undefined}
                  inactive={!landfill.isActive}
                  restore={restoreAction(restore, landfill.id, canManage && !landfill.isActive)}
                />
              )}
            </section>

            <LandfillAnalytics landfillId={landfill.id} />
          </div>

          <h2 className="section-title">Машины на полигоне ({landfill.vehicles.length})</h2>
          <VehiclesTable items={landfill.vehicles} />

          {/* Сотрудников сервер отдаёт только ролям, которые управляют пользователями */}
          {landfill.employees && (
            <>
              <h2 className="section-title">Сотрудники ({landfill.employees.length})</h2>
              <UsersTable items={landfill.employees} />
            </>
          )}

          <LandfillFormModal open={edit.open} landfill={landfill} onClose={edit.hide} />
          <DeleteDialog flow={remove} id={landfill.id} name={landfill.name} />
        </>
      )}
    </DetailPage>
  )
}
