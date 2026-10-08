import { useCallback, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { Field } from './Form'

type Props = {
  id: string
  label: string
  file?: File
  accept?: string
  hint?: string // допустимые форматы под надписью
  error?: string
  onChange: (file: File | undefined) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`
}

// Превью выбранного фото. URL создаётся и освобождается в ref-колбэке вместе с <img>
function FileThumb({ file }: { file: File }) {
  const attach = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return
      const url = URL.createObjectURL(file)
      img.src = url
      return () => URL.revokeObjectURL(url)
    },
    [file],
  )
  return <img ref={attach} className="file-drop-thumb" alt="" />
}

// Поле выбора файла: нативный input растянут поверх карточки и невидим, поэтому работают
// и клик, и перетаскивание файла
export function FileField({ id, label, file, accept, hint, error, onChange }: Props) {
  const [dragging, setDragging] = useState(false)

  return (
    <Field id={id} label={label} error={error}>
      <div
        className={cx(
          'file-drop',
          file && 'has-file',
          dragging && 'is-dragging',
          error && 'invalid',
        )}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="file-drop-input"
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={() => setDragging(false)}
          onChange={(e) => {
            const next = e.target.files?.[0]
            e.target.value = '' // чтобы повторный выбор того же файла тоже сработал
            if (next) onChange(next)
          }}
        />
        {file ? (
          <>
            <FileThumb file={file} />
            <span className="file-drop-text">
              <span className="file-drop-title">{file.name}</span>
              <span className="file-drop-hint">
                {formatSize(file.size)} · нажмите, чтобы заменить
              </span>
            </span>
            <button
              type="button"
              className="file-drop-remove"
              aria-label="Убрать файл"
              onClick={() => onChange(undefined)}
            >
              <X className="icon" />
            </button>
          </>
        ) : (
          <>
            <span className="file-drop-icon">
              <ImagePlus className="icon" />
            </span>
            <span className="file-drop-text">
              <span className="file-drop-title">Выберите фото</span>
              <span className="file-drop-hint">или перетащите сюда{hint ? ` · ${hint}` : ''}</span>
            </span>
          </>
        )}
      </div>
    </Field>
  )
}
