import { AlertTriangle, KeyRound, MapPin, Send } from 'lucide-react'
import { useMe } from '@/features/auth/hooks'
import { useCan, useOwnLandfillId } from '@/features/auth/permissions'
import { usePickedLandfill } from '@/features/landfills/usePickedLandfill'
import { formatDateTime, plural } from '@/shared/lib/format'
import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EntityHead, InfoList, InfoRow } from '@/shared/ui/InfoCard'
import { ConfirmModal } from '@/shared/ui/Modal'
import { Notice } from '@/shared/ui/Notice'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/Select'
import { EntityCardSkeleton, Skeleton } from '@/shared/ui/Skeleton'
import { Switch } from '@/shared/ui/Switch'
import { Tooltip } from '@/shared/ui/Tooltip'
import { hasCredentials, isPinLocked, type SendingSettings } from './api'
import { CredentialsModal } from './CredentialsModal'
import { useResetPin, useSendingSettings, useUpdateSchedule } from './hooks'
import { IntervalModal } from './IntervalModal'
import { PinModal } from './PinModal'
import { RevealModal } from './RevealModal'
import { SecretField } from './SecretField'
import { useRevealedCredentials } from './useRevealedCredentials'

// Настройки отправки отчётов в ФГИС УТКО: администрация — своего полигона, разработчик выбирает полигон
export function SendingPage() {
  const canPick = useCan('landfills.filter')
  const ownLandfillId = useOwnLandfillId()
  const me = useMe()
  const picked = usePickedLandfill(canPick)

  const landfillId = canPick ? picked.landfillId : (ownLandfillId ?? '')
  const name = canPick ? picked.name : me.data?.landfill?.name
  const noLandfill = !(canPick && picked.options.loading) && !landfillId

  const picker = canPick && (
    <div className="analytics-picker">
      <Select
        filter
        value={picked.landfillId}
        {...remoteSelectProps(picked.options, 'Выберите полигон')}
        // Пустого пункта нет: настройки всегда относятся к одному полигону
        options={picked.options.options}
        onChange={picked.pick}
      />
    </div>
  )

  return (
    <>
      <PageHeader title="Настройки ФГИС" />

      <div className="content-body">
        {noLandfill ? (
          <EmptyState
            icon={MapPin}
            title={canPick ? 'Полигонов пока нет' : 'Полигон не назначен'}
            description={
              canPick
                ? 'Настройки появятся, когда будет добавлен хотя бы один полигон.'
                : 'Настройки отправки относятся к полигону пользователя. Обратитесь к администратору.'
            }
          />
        ) : (
          <>
            <div className="analytics-head">
              <div>
                <h2 className="analytics-title">
                  {name ? `Полигон «${name}»` : <Skeleton width={220} />}
                </h2>
                <span className="analytics-sub">
                  Автоматическая отправка отчётов и доступ к ФГИС УТКО
                </span>
              </div>
              {picker}
            </div>
            {/* key: при смене полигона открытые окна и их формы не переносятся на другой полигон */}
            <SendingView key={landfillId} landfillId={landfillId} />
          </>
        )}
      </div>
    </>
  )
}

function SendingView({ landfillId }: { landfillId: string }) {
  const query = useSendingSettings(landfillId, Boolean(landfillId))

  if (query.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        tone="danger"
        title="Не удалось загрузить настройки"
        description={query.error.message}
        actions={<Button onClick={() => query.refetch()}>Повторить</Button>}
      />
    )
  }

  if (!query.data) {
    return (
      <div className="sending-cards">
        <EntityCardSkeleton />
        <EntityCardSkeleton />
      </div>
    )
  }

  return (
    <div className="sending-cards">
      <ScheduleCard settings={query.data} />
      <CredentialsCard settings={query.data} />
    </div>
  )
}

// «Каждую минуту», «Каждую 21 минуту», «Каждые 5 минут»: с формой «минуту» согласуется «каждую»
function everyMinutes(n: number) {
  if (n === 1) return 'Каждую минуту'
  const one = n % 10 === 1 && n % 100 !== 11
  return `${one ? 'Каждую' : 'Каждые'} ${plural(n, ['минуту', 'минуты', 'минут'])}`
}

function ScheduleCard({ settings }: { settings: SendingSettings }) {
  const edit = useDisclosure()
  const toggle = useUpdateSchedule(settings.landfillId)
  const enabled = settings.autoSendEnabled
  // Без ключей каждая отправка закончилась бы ошибкой, поэтому сервер не даёт включить автоотправку.
  // Уже включённую можно выключить
  const canToggle = hasCredentials(settings) || enabled

  const switcher = (
    <Switch
      label="Автоматическая отправка"
      // Для того чтобы анимация шла сразу по нажатию, пока запрос в пути переключатель стоит в новом
      // положении. При ошибке он вернётся: в кеше по-прежнему старое значение
      checked={toggle.isPending ? toggle.variables.autoSendEnabled : enabled}
      disabled={!canToggle}
      loading={toggle.isPending}
      onChange={(autoSendEnabled) =>
        toggle.mutate({ autoSendEnabled, sendIntervalMinutes: settings.sendIntervalMinutes })
      }
    />
  )

  return (
    <section className="info-card entity-card">
      <EntityHead
        icon={Send}
        label="Автоматическая отправка"
        title={enabled ? 'Включена' : 'Выключена'}
        aside={
          canToggle ? (
            switcher
          ) : (
            <Tooltip
              content={<span className="tooltip-text">Сначала задайте ключи ФГИС УТКО</span>}
            >
              {switcher}
            </Tooltip>
          )
        }
      />

      <InfoList>
        <InfoRow label="Интервал проверки">{everyMinutes(settings.sendIntervalMinutes)}</InfoRow>
        <InfoRow label="Следующая отправка">
          {enabled ? formatDateTime(settings.nextRunAt) : 'Не запланирована'}
        </InfoRow>
      </InfoList>

      {toggle.error ? (
        <Notice tone="danger">{toggle.error.message}</Notice>
      ) : (
        <Notice>
          {canToggle
            ? 'С заданным интервалом проверяется, есть ли отчёты «Ожидает отправки», и найденные уходят в ФГИС УТКО. Ошибка отправки видна в истории статусов отчёта.'
            : 'Чтобы включить автоматическую отправку, задайте ключи ФГИС УТКО.'}
        </Notice>
      )}

      <div className="entity-actions">
        <Button variant="soft" onClick={edit.show}>
          Изменить интервал
        </Button>
      </div>

      <IntervalModal open={edit.open} settings={settings} onClose={edit.hide} />
    </section>
  )
}

function CredentialsCard({ settings }: { settings: SendingSettings }) {
  const canReset = useCan('sending.reset')
  const pin = useDisclosure()
  const credentials = useDisclosure()
  const reveal = useDisclosure()
  const reset = useDisclosure()
  const resetPin = useResetPin(settings.landfillId)
  const revealed = useRevealedCredentials(settings)
  const configured = hasCredentials(settings)

  return (
    <section className="info-card entity-card">
      <EntityHead
        icon={KeyRound}
        label="Доступ к ФГИС УТКО"
        title={configured ? 'Ключи заданы' : 'Ключи не заданы'}
      />

      <div className="secret-list">
        <SecretField
          label="ObjectId"
          masked={settings.objectIdMasked}
          revealed={revealed.credentials?.objectId ?? null}
          onReveal={reveal.show}
        />
        <SecretField
          label="AccessKey"
          masked={settings.accessKeyMasked}
          revealed={revealed.credentials?.accessKey ?? null}
          onReveal={reveal.show}
        />
      </div>

      <InfoList>
        <InfoRow label="ПИН-код">{settings.hasPin ? 'Задан' : 'Не задан'}</InfoRow>
      </InfoList>

      {isPinLocked(settings) ? (
        <Notice tone="danger">
          Слишком много неверных попыток. Ввод ПИН-кода заблокирован до{' '}
          {formatDateTime(settings.pinLockedUntil)}.
        </Notice>
      ) : (
        <Notice>
          {configured
            ? 'Чтобы увидеть ключ целиком, нажмите на глаз и введите ПИН-код: ключи откроются на минуту. При замене ключей задаётся новый ПИН-код.'
            : 'Вместе с ключами задаётся ПИН-код: он понадобится, чтобы посмотреть ключи целиком.'}
        </Notice>
      )}

      <div className="entity-actions">
        <Button onClick={credentials.show}>{configured ? 'Заменить ключи' : 'Задать ключи'}</Button>
        {settings.hasPin && (
          <Button variant="ghost" onClick={pin.show}>
            Сменить ПИН-код
          </Button>
        )}
        {canReset && settings.hasPin && (
          <Button variant="danger-soft" onClick={reset.show}>
            Сбросить ПИН-код
          </Button>
        )}
      </div>

      <PinModal open={pin.open} settings={settings} onClose={pin.hide} />
      <CredentialsModal open={credentials.open} settings={settings} onClose={credentials.hide} />
      <RevealModal
        open={reveal.open}
        settings={settings}
        onClose={reveal.hide}
        onRevealed={revealed.show}
      />
      <ConfirmModal
        open={reset.open}
        title="Сбросить ПИН-код?"
        text="Вместе с ПИН-кодом будут стёрты ключи ФГИС УТКО, а автоматическая отправка выключится. Администрации полигона нужно будет задать ключи и ПИН-код заново."
        confirmText="Сбросить"
        danger
        loading={resetPin.isPending}
        error={resetPin.error?.message}
        onConfirm={() => resetPin.mutate(undefined, { onSuccess: reset.hide })}
        // Ошибка прошлой попытки не показывается при следующем открытии
        onClose={() => {
          resetPin.reset()
          reset.hide()
        }}
      />
    </section>
  )
}
