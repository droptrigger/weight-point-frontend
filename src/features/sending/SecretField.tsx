import { useId, useState } from 'react'
import { Check, Copy, Eye } from 'lucide-react'
import { cx } from '@/shared/lib/cx'

type Props = {
  label: string
  masked: string | null // null — ключ не задан
  revealed: string | null // ключ целиком, когда ПИН-код уже введён
  onReveal: () => void
}

// Ключ на карточке: подпись и поле, в поле звёздочки и «глаз», который просит ПИН-код.
// После верного ПИН-кода в поле ключ целиком, а вместо «глаза» кнопка копирования
export function SecretField({ label, masked, revealed, onReveal }: Props) {
  const id = useId()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!revealed) return
    try {
      await navigator.clipboard.writeText(revealed)
    } catch {
      // Буфер обмена доступен только по HTTPS и на localhost. Без него ключ копируют вручную:
      // текст в поле выделяется целиком по клику
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="secret">
      <div className="secret-label" id={id}>
        {label}
      </div>
      <div className={cx('secret-field', revealed && 'is-revealed', !masked && 'is-empty')}>
        <span className="secret-text" aria-labelledby={id}>
          {masked ? (revealed ?? masked) : 'Не задан'}
        </span>
        {masked &&
          (revealed ? (
            <button
              type="button"
              className={cx('icon-btn secret-action', copied && 'is-done')}
              aria-label={copied ? `${label} скопирован` : `Скопировать ${label}`}
              onClick={copy}
            >
              {copied ? <Check className="icon" /> : <Copy className="icon" />}
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn secret-action"
              aria-label={`Показать ${label} по ПИН-коду`}
              onClick={onReveal}
            >
              <Eye className="icon" />
            </button>
          ))}
      </div>
    </div>
  )
}
