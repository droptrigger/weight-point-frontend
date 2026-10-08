import { useState, type CSSProperties, type ReactNode } from 'react'
import { LoadingImage } from '@/shared/ui/LoadingImage'

type Props = { src: string; alt: string; children?: ReactNode }

// Снимок, вписанный в рамку целиком, в обёртке ровно по его размеру: всё, что лежит в children,
// позиционируется относительно самого фото, а не пустых полей рамки
export function FittedPhoto({ src, alt, children }: Props) {
  const [ratio, setRatio] = useState<number>()
  const style = ratio ? ({ '--ratio': ratio } as CSSProperties) : undefined

  return (
    <span className="photo-fit" style={style}>
      <LoadingImage
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget
          if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight)
        }}
      />
      {children}
    </span>
  )
}
