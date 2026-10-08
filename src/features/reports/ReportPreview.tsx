import { useState, type CSSProperties } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { LoadingImage } from '@/shared/ui/LoadingImage'
import { PhotoViewer } from '@/shared/ui/PhotoViewer'
import { Skeleton } from '@/shared/ui/Skeleton'
import type { PhotoTypeCode } from './api'
import { useReportPhotos } from './hooks'
import { photosByType, viewerShots } from './photos'

// Фото отчёта под строкой списка: остальное уже видно в таблице, поэтому грузятся только фото
type Props = {
  id: string
  columns: Record<PhotoTypeCode, number> // номер колонки строки, под которой стоит фото
}

export function ReportPreview({ id, columns }: Props) {
  const { data, isPending, isError } = useReportPhotos(id)
  const [viewer, setViewer] = useState<number | null>(null)

  if (isError) {
    return <div className="report-preview report-preview--state">Не удалось загрузить фото</div>
  }

  const photos = photosByType(data)
  const shots = viewerShots(photos)

  return (
    <div className="report-preview">
      {photos.map(({ id: type, label, photo }) => (
        <figure
          key={type}
          className="preview-photo"
          style={{ '--col': columns[type] } as CSSProperties}
        >
          {isPending ? (
            <div className="photo-frame">
              <Skeleton variant="block" width="100%" />
            </div>
          ) : photo?.downloadUrl ? (
            <button
              type="button"
              className="photo-frame has-img"
              aria-label={`Открыть фото: ${label}`}
              onClick={() => setViewer(shots.findIndex((s) => s.typeId === type))}
            >
              <LoadingImage src={photo.downloadUrl} alt={`Фото: ${label}`} loading="lazy" />
            </button>
          ) : (
            <div className="photo-frame">
              <ImageIcon className="icon" />
              Нет фото
            </div>
          )}
          <figcaption>{label}</figcaption>
        </figure>
      ))}

      <PhotoViewer
        photos={shots}
        index={viewer}
        onIndex={setViewer}
        onClose={() => setViewer(null)}
      />
    </div>
  )
}
