import { cx } from '@/shared/lib/cx'
import { Tooltip } from '@/shared/ui/Tooltip'
import { useLiveState, type LiveState } from './store'

const TEXT: Record<LiveState, { label: string; hint: string }> = {
  online: {
    label: 'В реальном времени',
    hint: 'Изменения других пользователей и ход отправки появляются без обновления страницы',
  },
  connecting: {
    label: 'Подключение…',
    hint: 'Соединение с сервером устанавливается. Пока его нет, данные могут быть не самыми свежими',
  },
  offline: {
    label: 'Нет связи',
    hint: 'Сервер обновлений недоступен, подключение повторится само. После него данные перечитаются',
  },
}

// Есть ли сейчас связь с сервером обновлений: без неё список может отставать
export function LiveIndicator() {
  const state = useLiveState()
  const { label, hint } = TEXT[state]

  return (
    <Tooltip content={<span className="tooltip-text">{hint}</span>}>
      <span className={cx('live-indicator', `live-indicator--${state}`)} role="status">
        <span className="live-dot" aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  )
}
