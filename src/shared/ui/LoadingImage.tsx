import { useState, type ImgHTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react'
import { ImageOff, RotateCw } from 'lucide-react'
import { cx } from '@/shared/lib/cx'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & { src: string }

type Loaded = { src: string; attempt: number; status: 'loaded' | 'error' }

// <img> с заглушкой, пока снимок грузится, и с повтором, если не загрузился.
// Заглушки кладутся поверх картинки абсолютно: у родителя должно быть position: relative.
// Повтор лежит внутри кнопки-рамки фото, поэтому это не <button>, а span с role="button"
export function LoadingImage({ src, className, onLoad, ...rest }: Props) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded>()
  // Состояние относится к конкретному адресу и попытке: при смене фото заглушка появляется сама
  const status = loaded?.src === src && loaded.attempt === attempt ? loaded.status : 'loading'

  const retry = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation() // не открывать просмотр фото
    e.preventDefault()
    setAttempt((a) => a + 1)
  }

  return (
    <>
      <img
        // Новый элемент на каждую попытку, иначе браузер не станет грузить тот же адрес заново
        key={`${src}#${attempt}`}
        src={src}
        className={cx('loading-img', status === 'loaded' && 'is-loaded', className)}
        onLoad={(e) => {
          setLoaded({ src, attempt, status: 'loaded' })
          onLoad?.(e)
        }}
        onError={() => setLoaded({ src, attempt, status: 'error' })}
        {...rest}
      />
      {status === 'loading' && (
        <span className="img-overlay img-loading" role="status" aria-label="Фото загружается">
          <span className="spinner" />
        </span>
      )}
      {status === 'error' && (
        <span className="img-overlay img-error" role="alert">
          <ImageOff className="icon" />
          <span>Не удалось загрузить фото</span>
          <span
            role="button"
            tabIndex={0}
            className="img-retry"
            onClick={retry}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') retry(e)
            }}
          >
            <RotateCw className="icon" />
            Повторить
          </span>
        </span>
      )}
    </>
  )
}
