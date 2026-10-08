import type { ChangeEvent, ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { cx } from '@/shared/lib/cx'

type Props = {
  accept: string
  pending: boolean // идёт загрузка: вместо иконки спиннер
  disabled?: boolean
  className?: string
  children: ReactNode // подпись, например «Заменить фото» или «Загрузка…»
  onFile: (file: File) => void
}

// Кнопка выбора файла: <label> в виде кнопки со скрытым input внутри
export function FileButton({
  accept,
  pending,
  disabled = pending,
  className,
  children,
  onFile,
}: Props) {
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // чтобы можно было выбрать тот же файл повторно
    if (file) onFile(file)
  }

  return (
    <label
      className={cx('btn btn--soft', className)}
      aria-disabled={disabled}
      aria-busy={pending || undefined}
    >
      {!pending && <Upload className="icon" />}
      {children}
      <input type="file" accept={accept} hidden disabled={disabled} onChange={change} />
    </label>
  )
}
