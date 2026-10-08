import type { ViewerPhoto } from '@/shared/ui/PhotoViewer'
import type { PhotoTypeCode, ReportPhoto } from './api'

// Порядок фото: машина, весы с грузом, весы без груза. На странице отчёта над ними веса
export const PHOTO_TYPES: { id: PhotoTypeCode; label: string }[] = [
  { id: 'vehicle', label: 'Фото машины' },
  { id: 'brutto', label: 'Весы с грузом' },
  { id: 'tara', label: 'Весы без груза' },
]

// Форматы фото, которые принимает сервер
export const PHOTO_ACCEPT = 'image/jpeg,image/png'

export const photosByType = (photos: ReportPhoto[] = []) =>
  PHOTO_TYPES.map((type) => ({
    ...type,
    photo: photos.find((p) => p.photoType.code === type.id),
  }))

export type ReportShot = ViewerPhoto & { typeId: PhotoTypeCode }

// В просмотрщик попадают только загруженные фото
export const viewerShots = (photos: ReturnType<typeof photosByType>): ReportShot[] =>
  photos.flatMap(({ id, label, photo }) =>
    photo?.downloadUrl ? [{ typeId: id, src: photo.downloadUrl, label }] : [],
  )
