import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useDialog } from '@/shared/lib/useDialog'
import { LoadingImage } from './LoadingImage'

export type ViewerPhoto = { src: string; label: string }

type Props = {
  photos: ViewerPhoto[]
  index: number | null
  onIndex: (index: number) => void
  onClose: () => void
}

export function PhotoViewer({ photos, index, onIndex, onClose }: Props) {
  const photo = index === null ? undefined : photos[index]
  const ref = useDialog(photo !== undefined)
  const multiple = photos.length > 1

  const go = (step: number) => {
    if (index !== null) onIndex((index + step + photos.length) % photos.length)
  }

  return (
    <dialog
      ref={ref}
      className="viewer"
      onClose={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // клик по затемнению
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1)
        if (e.key === 'ArrowRight') go(1)
      }}
    >
      {photo && (
        <>
          <button
            type="button"
            className="viewer-btn viewer-close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X className="icon" />
          </button>
          {multiple && (
            <>
              <button
                type="button"
                className="viewer-btn viewer-prev"
                aria-label="Предыдущее фото"
                onClick={() => go(-1)}
              >
                <ChevronLeft className="icon" />
              </button>
              <button
                type="button"
                className="viewer-btn viewer-next"
                aria-label="Следующее фото"
                onClick={() => go(1)}
              >
                <ChevronRight className="icon" />
              </button>
            </>
          )}
          <figure className="viewer-figure">
            <div className="viewer-img">
              <LoadingImage src={photo.src} alt={photo.label} />
            </div>
            <figcaption className="viewer-caption">
              {photo.label}
              {multiple && ` · ${(index ?? 0) + 1} из ${photos.length}`}
            </figcaption>
          </figure>
        </>
      )}
    </dialog>
  )
}
