import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import {
  ChevronRight,
  History,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Recycle,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useCan } from '@/features/auth/permissions'
import { coordsLabel } from '@/features/landfills/api'
import { fullName } from '@/features/users/api'
import { plateLabel } from '@/features/vehicles/api'
import { formatWasteCode } from '@/features/waste-types/code'
import { cx } from '@/shared/lib/cx'
import { formatDateTime, formatKg } from '@/shared/lib/format'
import { useDeleteFlow } from '@/shared/lib/useDeleteFlow'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { PlateNumber } from '@/shared/ui/Badges'
import { Button } from '@/shared/ui/Button'
import { DetailPage } from '@/shared/ui/DetailPage'
import { EntityLink } from '@/shared/ui/EntityLink'
import { FileButton } from '@/shared/ui/FileButton'
import { DeliveryTruck } from '@/shared/ui/icons'
import { ConfirmModal } from '@/shared/ui/Modal'
import { PhotoViewer } from '@/shared/ui/PhotoViewer'
import { Skeleton } from '@/shared/ui/Skeleton'
import type { PhotoTypeCode, ReportDetails } from './api'
import { FittedPhoto } from './FittedPhoto'
import { useDeleteReport, useReplaceReportPhoto, useReport } from './hooks'
import { PHOTO_ACCEPT, PHOTO_TYPES, photosByType, viewerShots } from './photos'
import { ReportFormModal } from './ReportFormModal'
import { ReportReviewActions } from './ReportReviewActions'
import { ReportSourceIcon } from './ReportSourceIcon'
import { ReportStatusBadge } from './ReportStatusBadge'
import { ReportStatusHistory } from './ReportStatusHistory'
import { REPORT_SOURCE_LABELS } from './sources'

type StatProps = {
  label: string
  value: string
  sub: string
}

type GroupProps = { to?: string; icon: LucideIcon; title: string; children: ReactNode }

// Вся группа кликабельна: ссылка в заголовке растянута на блок через ::after
function Group({ to, icon: Icon, title, children }: GroupProps) {
  return (
    <div className="detail-group">
      <div className="detail-head">
        <span className="detail-icon">
          <Icon className="icon" />
        </span>
        <h3>
          {to ? (
            <EntityLink className="detail-link" to={to}>
              {title}
            </EntityLink>
          ) : (
            title
          )}
        </h3>
      </div>
      <dl className="detail-fields">{children}</dl>
      {to && <ChevronRight className="icon detail-arrow" />}
    </div>
  )
}

function DetailField({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  )
}

function Stat({ label, value, sub }: StatProps) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

export function ReportPage() {
  const id = useParams().id ?? ''
  const query = useReport(id)

  return (
    <DetailPage
      title="Отчёт"
      backTo="/reports"
      query={query}
      notFound="Отчёт не найден"
      failed="Не удалось загрузить отчёт"
      skeleton={<ReportSkeleton />}
    >
      {(report) => <ReportView report={report} />}
    </DetailPage>
  )
}

export function ReportSkeleton() {
  return (
    <div role="status" aria-label="Загрузка">
      <section className="summary">
        <div className="summary-left">
          <div className="skeleton-stack skeleton-stack--tight">
            <Skeleton width={56} height={12} />
            <Skeleton width={160} height={16} />
          </div>
          <Skeleton width={110} height={26} />
        </div>
      </section>

      <h2 className="section-title">Взвешивание</h2>
      <section className="weighing">
        {PHOTO_TYPES.map((type) => (
          <figure key={type.id} className="weigh-card">
            <div className="stat skeleton-stack skeleton-stack--tight">
              <Skeleton width="40%" />
              <Skeleton variant="stat" width="60%" />
              <Skeleton width="50%" height={12} />
            </div>
            <div className="photo-frame">
              <Skeleton variant="block" width="100%" />
            </div>
          </figure>
        ))}
      </section>
    </div>
  )
}

type ViewProps = {
  report: ReportDetails
  onDeleted?: () => void // в панели списка: закрыть её вместо перехода «Назад»
}

// Содержимое отчёта: на его странице и в панели списка отчётов
export function ReportView({ report: r, onDeleted }: ViewProps) {
  const canSeeUsers = useCan('users.view')
  const canSeeLandfills = useCan('landfills.view')
  // Отправленный в ФГИС УТКО отчёт больше не меняется
  const canEdit = useCan('reports.edit') && r.status.code !== 'sent'
  // Удаление безвозвратное, отправленный в ФГИС УТКО отчёт сервер удалить не даст
  const canDelete = useCan('reports.delete') && r.status.code !== 'sent'
  const edit = useDisclosure()
  const remove = useDeleteFlow(useDeleteReport(), '/reports', onDeleted)
  const replace = useReplaceReportPhoto()
  const replacingId = replace.isPending ? replace.variables.photoId : null
  const [viewer, setViewer] = useState<number | null>(null)
  // Почему сервер не сменил статус или ошибка запроса — под сводкой, кнопки стоят в ней
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)

  const photos = photosByType(r.photos)
  // Над фото машины — вес отходов, над фото весов — их показания
  const weights: Record<PhotoTypeCode, StatProps> = {
    vehicle: {
      label: 'Вес отходов',
      value: formatKg(r.weightNettoKg),
      sub: 'С грузом − без груза',
    },
    brutto: {
      label: 'Машина с грузом',
      value: formatKg(r.weightBruttoKg),
      sub: formatDateTime(r.bruttoAt),
    },
    tara: {
      label: 'Пустая машина',
      value: formatKg(r.weightTaraKg),
      sub: formatDateTime(r.taraAt),
    },
  }
  const shots = viewerShots(photos)

  return (
    <>
      <section className="summary">
        <div className="summary-left">
          <div>
            <div className="muted">Создан</div>
            <div className="summary-date">{formatDateTime(r.createdAt)}</div>
          </div>
          <ReportStatusBadge status={r.status} />
        </div>
        {r.sentAt && (
          <div className="summary-right">
            <div>
              <div className="muted">Отправлен в ФГИС УТКО</div>
              <div className="summary-date">{formatDateTime(r.sentAt)}</div>
            </div>
          </div>
        )}
        <div className="summary-actions">
          {canEdit && (
            <Button variant="soft" onClick={edit.show}>
              <Pencil className="icon" />
              Редактировать
            </Button>
          )}
          <ReportReviewActions report={r} onMessage={setReviewMessage} />
          {canDelete && (
            <Button variant="danger-soft" onClick={remove.show}>
              <Trash2 className="icon" />
              Удалить
            </Button>
          )}
        </div>
      </section>
      {reviewMessage && <div className="modal-error modal-error--spaced">{reviewMessage}</div>}

      <h2 className="section-title">Взвешивание</h2>
      <section className="weighing">
        {photos.map(({ id, label, photo }) => (
          <figure key={id} className="weigh-card">
            <Stat {...weights[id]} />
            {photo?.downloadUrl ? (
              <button
                type="button"
                className="photo-frame photo-frame--fit has-img"
                aria-label={`Открыть фото: ${label}`}
                onClick={() => setViewer(shots.findIndex((s) => s.typeId === id))}
              >
                <FittedPhoto src={photo.downloadUrl} alt={`Фото: ${label}`}>
                  {/* Госномер прямо на фото машины: снимок и номер сверяются с одного взгляда */}
                  {id === 'vehicle' && (
                    <span className="photo-plate">
                      <PlateNumber number={r.vehicle.plateNumber} region={r.vehicle.regionCode} />
                    </span>
                  )}
                </FittedPhoto>
              </button>
            ) : (
              <div className="photo-frame">
                <ImageIcon className="icon" />
                Нет фото
              </div>
            )}
            <figcaption className="photo-info">
              <span className={cx('photo-status', photo?.uploadedAt && 'ok')}>
                {photo?.uploadedAt
                  ? `Загружено ${formatDateTime(photo.uploadedAt)}`
                  : 'Не загружено'}
              </span>
              {/* Замена фото — правка отчёта: принятый отчёт после неё уходит на повторную проверку */}
              {canEdit && photo && (
                <FileButton
                  className="btn--sm photo-replace"
                  accept={PHOTO_ACCEPT}
                  pending={replacingId === photo.id}
                  disabled={replace.isPending}
                  onFile={(file) => replace.mutate({ reportId: r.id, photoId: photo.id, file })}
                >
                  {replacingId === photo.id
                    ? 'Загрузка…'
                    : photo.downloadUrl
                      ? 'Заменить'
                      : 'Загрузить'}
                </FileButton>
              )}
            </figcaption>
          </figure>
        ))}
      </section>
      {replace.error && (
        <div className="modal-error modal-error--spaced">{replace.error.message}</div>
      )}

      <h2 className="section-title">Детали</h2>
      <section className="details">
        <Group to={`/vehicles/${r.vehicle.id}`} icon={DeliveryTruck} title="Транспорт">
          <DetailField label="Марка">{r.vehicle.make?.name}</DetailField>
          <DetailField label="Госномер">{plateLabel(r.vehicle)}</DetailField>
          <DetailField label="Перевозчик">
            {r.vehicle.carrier && (
              <EntityLink className="field-link" to={`/carriers/${r.vehicle.carrier.id}`}>
                {r.vehicle.carrier.name}
              </EntityLink>
            )}
          </DetailField>
        </Group>
        {/* Полигон видит только разработчик, остальные работают в своём */}
        {canSeeLandfills && (
          <Group to={`/landfills/${r.landfill.id}`} icon={MapPin} title="Полигон">
            <DetailField label="Название">{r.landfill.name}</DetailField>
            <DetailField label="Координаты">{coordsLabel(r.landfill)}</DetailField>
          </Group>
        )}
        <Group
          to={r.wasteType ? `/waste-types/${r.wasteType.id}` : undefined}
          icon={Recycle}
          title="Вид отходов"
        >
          <DetailField label="Название">{r.wasteType?.name}</DetailField>
          <DetailField label="Код">{r.wasteType && formatWasteCode(r.wasteType.code)}</DetailField>
        </Group>
        {/* Без права на пользователей карточка сотрудника не открывается */}
        <Group
          to={canSeeUsers ? `/users/${r.user.id}` : undefined}
          icon={UserRound}
          title="Сотрудник"
        >
          <DetailField label="Имя">{fullName(r.user)}</DetailField>
          <DetailField label="Email">{r.user.email}</DetailField>
          <DetailField label="Роль">{r.user.role}</DetailField>
        </Group>
        <Group icon={History} title="История">
          <DetailField label="Источник">
            <ReportSourceIcon source={r.source} />
            {REPORT_SOURCE_LABELS[r.source]}
          </DetailField>
          <DetailField label="Получен сервером">
            {r.syncedAt && formatDateTime(r.syncedAt)}
          </DetailField>
          <DetailField label="Изменён">
            {r.updatedBy && (
              <>
                {formatDateTime(r.updatedAt)} ·{' '}
                {canSeeUsers ? (
                  <EntityLink className="field-link" to={`/users/${r.updatedBy.id}`}>
                    {fullName(r.updatedBy)}
                  </EntityLink>
                ) : (
                  fullName(r.updatedBy)
                )}
              </>
            )}
          </DetailField>
        </Group>
      </section>

      <ReportStatusHistory reportId={r.id} />

      <PhotoViewer
        photos={shots}
        index={viewer}
        onIndex={setViewer}
        onClose={() => setViewer(null)}
      />
      <ReportFormModal open={edit.open} report={r} onClose={edit.hide} />
      <ConfirmModal
        open={remove.open}
        title="Удалить отчёт?"
        text={`Удалить отчёт по машине «${plateLabel(r.vehicle)}» от ${formatDateTime(r.createdAt)} вместе с фото? Это действие нельзя отменить.`}
        confirmText="Удалить"
        danger
        loading={remove.loading}
        error={remove.error}
        onClose={remove.close}
        onConfirm={() => remove.confirm(r.id)}
      />
    </>
  )
}
