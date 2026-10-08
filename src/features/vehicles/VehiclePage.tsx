import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { LandfillInfoRow } from '@/features/landfills/LandfillInfoRow'
import { fullName } from '@/features/users/api'
import { cx } from '@/shared/lib/cx'
import { formatDateTime } from '@/shared/lib/format'
import { restoreAction } from '@/shared/lib/restoreAction'
import { useDeleteFlow } from '@/shared/lib/useDeleteFlow'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { PlateNumber } from '@/shared/ui/Badges'
import { DetailPage } from '@/shared/ui/DetailPage'
import { DeleteDialog, EntityActions } from '@/shared/ui/EntityActions'
import { EntityLink } from '@/shared/ui/EntityLink'
import { FileButton } from '@/shared/ui/FileButton'
import { InfoList, InfoRow } from '@/shared/ui/InfoCard'
import { LoadingImage } from '@/shared/ui/LoadingImage'
import { PhotoViewer } from '@/shared/ui/PhotoViewer'
import { InfoListSkeleton, Skeleton } from '@/shared/ui/Skeleton'
import { plateLabel, type VehicleDetails } from './api'
import { useDeleteVehicle, useRestoreVehicle, useUploadVehicleImage, useVehicle } from './hooks'
import { VehicleAnalytics } from './VehicleAnalytics'
import { VehicleFormModal } from './VehicleFormModal'
import { VehicleNettoChart } from './VehicleNettoChart'
import { VehicleVisits } from './VehicleVisits'

export function VehiclePage() {
  const id = useParams().id ?? ''
  const query = useVehicle(id)

  return (
    <DetailPage
      title="Машина"
      backTo="/vehicles"
      query={query}
      notFound="Машина не найдена"
      failed="Не удалось загрузить машину"
      skeleton={<VehicleSkeleton id={id} />}
    >
      {(vehicle) => <VehicleView vehicle={vehicle} />}
    </DetailPage>
  )
}

// Плитки аналитики и график в заглушке пустые: запросы уходят, только когда машина загрузилась
function VehicleSkeleton({ id }: { id: string }) {
  return (
    <div role="status" aria-label="Загрузка">
      <div className="detail-layout">
        <figure className="photo vehicle-photo">
          <Skeleton variant="block" />
        </figure>
        <div className="detail-side">
          <VehicleAnalytics vehicleId={id} enabled={false} />
          <section className="info-card">
            <InfoListSkeleton rows={4} />
          </section>
        </div>
      </div>
      <VehicleNettoChart vehicleId={id} enabled={false} />
      <VehicleVisits vehicleId={id} enabled={false} />
    </div>
  )
}

function VehicleView({ vehicle: v }: { vehicle: VehicleDetails }) {
  const canEdit = useCan('reference.edit')
  const canSeeUsers = useCan('users.view')
  const edit = useDisclosure()
  const remove = useDeleteFlow(useDeleteVehicle(), '/vehicles')
  const canRestore = useCan('inactive.restore')
  const restore = useRestoreVehicle()
  const upload = useUploadVehicleImage()
  const [viewer, setViewer] = useState<number | null>(null)

  // Госномер в правом верхнем углу фото, как на странице отчёта
  const plate = (
    <span className="photo-plate">
      <PlateNumber number={v.plateNumber} region={v.regionCode} />
    </span>
  )

  return (
    <>
      <div className="detail-layout">
        <figure className="photo vehicle-photo">
          {v.imageUrl ? (
            <button
              type="button"
              className="photo-frame has-img"
              aria-label="Открыть фото"
              onClick={() => setViewer(0)}
            >
              <LoadingImage src={v.imageUrl} alt={`Фото машины ${v.plateNumber}`} />
              {plate}
            </button>
          ) : (
            <div className="photo-frame empty">
              <ImageIcon className="icon" />
              <span>Фото не загружено</span>
              {plate}
            </div>
          )}
          <figcaption className="photo-info">
            <span className="photo-name">Фото машины</span>
            <span className={cx('photo-status', v.imageUrl && 'ok')}>
              {v.imageUrl ? 'Загружено' : 'Нет фото'}
            </span>
          </figcaption>
        </figure>

        <div className="detail-side">
          <VehicleAnalytics vehicleId={v.id} />

          <section className="info-card">
            <InfoList>
              <InfoRow label="Марка">{v.make?.name}</InfoRow>
              <InfoRow label="Перевозчик">
                {v.carrier && (
                  <EntityLink className="info-link" to={`/carriers/${v.carrier.id}`}>
                    {v.carrier.name}
                    <ChevronRight className="icon" />
                  </EntityLink>
                )}
              </InfoRow>
              <InfoRow label="Регион">{v.regionCode}</InfoRow>
              {v.landfill && <LandfillInfoRow landfillId={v.landfill.id} />}
              <InfoRow label="Добавлена">{formatDateTime(v.createdAt)}</InfoRow>
              {v.createdBy && (
                <InfoRow label="Создал">
                  {canSeeUsers ? (
                    <EntityLink className="info-link" to={`/users/${v.createdBy.id}`}>
                      {fullName(v.createdBy)}
                      <ChevronRight className="icon" />
                    </EntityLink>
                  ) : (
                    fullName(v.createdBy)
                  )}
                </InfoRow>
              )}
            </InfoList>

            <Link className="btn-primary" to={`/reports?vehicleId=${v.id}`}>
              Отчёты по этой машине
            </Link>

            {canEdit && (
              <EntityActions
                onEdit={edit.show}
                onDelete={remove.show}
                inactive={!v.isActive}
                restore={restoreAction(restore, v.id, canRestore && !v.isActive)}
              >
                <FileButton
                  accept="image/*"
                  pending={upload.isPending}
                  onFile={(file) => upload.mutate({ id: v.id, file })}
                >
                  {upload.isPending
                    ? 'Загрузка фото…'
                    : v.imageUrl
                      ? 'Заменить фото'
                      : 'Загрузить фото'}
                </FileButton>
              </EntityActions>
            )}
            {upload.error && (
              <div className="modal-error modal-error--spaced">{upload.error.message}</div>
            )}
          </section>
        </div>
      </div>

      <VehicleNettoChart vehicleId={v.id} />
      <VehicleVisits vehicleId={v.id} />

      <VehicleFormModal open={edit.open} vehicle={v} onClose={edit.hide} />
      <DeleteDialog flow={remove} id={v.id} subject="машину" name={plateLabel(v)} />
      <PhotoViewer
        photos={v.imageUrl ? [{ src: v.imageUrl, label: `Фото машины ${plateLabel(v)}` }] : []}
        index={viewer}
        onIndex={setViewer}
        onClose={() => setViewer(null)}
      />
    </>
  )
}
