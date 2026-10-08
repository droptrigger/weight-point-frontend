import { useEffect, useRef, useState } from 'react'
import {
  BatteryMedium,
  Camera,
  Check,
  CheckCircle2,
  CloudCheck,
  CloudOff,
  RotateCcw,
  Scale,
  ScanText,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { formatKg, formatNumber } from '@/shared/lib/format'
import { PlateNumber } from '@/shared/ui/Badges'
import { Button } from '@/shared/ui/Button'
import { DeliveryTruck } from '@/shared/ui/icons'
import { Spinner } from '@/shared/ui/Spinner'
import { DEMO_WEIGHING } from './demoData'

// idle → (фото машины) → photo → (фото табло) → loaded → (фото табло) → saved → synced.
// reading — вес распознаётся с только что снятого фото табло
type Phase = 'idle' | 'photo' | 'reading' | 'loaded' | 'saved' | 'synced'

const READ_MS = 1100 // столько «распознаётся» вес на фото
const SYNC_DELAY = 1800 // через сколько появляется сеть и отчёт уходит на сервер

const { plate, region, wasteType, carrier, bruttoKg, taraKg } = DEMO_WEIGHING

const PHOTOS = [
  { key: 'vehicle', label: 'Машина', icon: DeliveryTruck },
  { key: 'brutto', label: 'С грузом', icon: Scale },
  { key: 'tara', label: 'Пустая', icon: Scale },
] as const

const STEPS = [
  { title: 'Фото машины', text: 'Снимок машины с госномером на въезде' },
  {
    title: 'Машина с грузом',
    text: 'Фото табло весов: вес распознаётся прямо на телефоне, без интернета',
  },
  {
    title: 'Пустая машина',
    text: 'После разгрузки – ещё одно фото табло, вес отходов считается сам',
  },
  {
    title: 'Отправка на сервер',
    text: 'Без связи отчёт ждёт на устройстве и уходит, когда есть сеть',
  },
]

// Мобильное приложение весовой: оператор фотографирует машину и табло весов с грузом и пустой,
// вес считывается с фото, вес отходов – разница между ними
export function DemoScale() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [photos, setPhotos] = useState(0)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  // Фото табло: пауза на распознавание, затем следующий шаг
  const readScale = (then: () => void) => {
    setPhase('reading')
    timer.current = window.setTimeout(then, READ_MS)
  }

  const next = () => {
    if (phase === 'idle') {
      setPhase('photo')
      setPhotos(1)
    } else if (phase === 'photo') {
      readScale(() => {
        setPhase('loaded')
        setPhotos(2)
      })
    } else if (phase === 'loaded') {
      readScale(() => {
        setPhase('saved')
        setPhotos(3)
        timer.current = window.setTimeout(() => setPhase('synced'), SYNC_DELAY)
      })
    } else if (phase !== 'reading') {
      clearTimeout(timer.current)
      setPhase('idle')
      setPhotos(0)
    }
  }

  const done = phase === 'saved' || phase === 'synced'
  const online = phase === 'synced'
  const step = online ? 4 : phase === 'saved' ? 3 : photos
  const action =
    phase === 'idle'
      ? 'Сфотографировать машину'
      : phase === 'photo'
        ? 'Сфотографировать табло'
        : phase === 'loaded'
          ? 'Табло после разгрузки'
          : phase === 'reading'
            ? 'Распознаём…'
            : 'Новое взвешивание'

  // Табло: крупная надпись в карточке веса
  const readout =
    phase === 'reading'
      ? { label: 'Распознаём вес на фото…', value: null }
      : done
        ? { label: 'Вес отходов', value: bruttoKg - taraKg }
        : phase === 'loaded'
          ? { label: 'С грузом · распознано с фото', value: bruttoKg }
          : { label: 'С грузом', value: undefined }

  return (
    <div className="demo-scale">
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-status">
            <span>9:41</span>
            <span className="phone-island" />
            <span className="phone-status-icons">
              {online ? <Wifi className="icon" /> : <WifiOff className="icon" />}
              <BatteryMedium className="icon" />
            </span>
          </div>

          <div className="phone-app">
            <div className="phone-head">
              <span className="phone-title">Взвешивание</span>
              <span className="phone-sub">Полигон «Северный»</span>
            </div>

            <div className={cx('phone-net', online && 'is-online')}>
              {online ? <CloudCheck className="icon" /> : <CloudOff className="icon" />}
              {online ? 'Отчёт отправлен на сервер' : 'Нет сети'}
            </div>

            <div className="phone-card">
              <PlateNumber number={plate} region={region} />
              <span className="phone-card-meta">
                {wasteType} · {carrier}
              </span>
            </div>

            <div className={cx('phone-scale', phase === 'reading' && 'is-reading')}>
              <span className="phone-scale-label">
                {phase === 'reading' ? (
                  <Spinner size="sm" label="Распознаём" />
                ) : (
                  <ScanText className="icon" />
                )}
                {readout.label}
              </span>
              <span className="phone-scale-value">
                {readout.value == null ? '–' : formatNumber(readout.value)}
                <small>кг</small>
              </span>
            </div>

            <dl className="phone-weights">
              <div>
                <dt>С грузом</dt>
                <dd>{photos >= 2 ? formatKg(bruttoKg) : '–'}</dd>
              </div>
              <div>
                <dt>Пустая</dt>
                <dd>{done ? formatKg(taraKg) : '–'}</dd>
              </div>
            </dl>

            <div className="phone-photos">
              {PHOTOS.map(({ key, label, icon: Icon }, i) => (
                <div key={key} className={cx('phone-photo', i < photos && 'is-taken')}>
                  {i < photos ? <Icon className="icon" /> : <Camera className="icon" />}
                  <span>{label}</span>
                  {i < photos && (
                    <span className="phone-photo-check">
                      <Check className="icon" />
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="phone-action"
              variant={done ? 'soft' : 'primary'}
              disabled={phase === 'reading'}
              onClick={next}
            >
              {done ? <RotateCcw className="icon" /> : <Camera className="icon" />}
              {action}
            </Button>
          </div>
        </div>
      </div>

      <ol className="demo-scale-steps">
        {STEPS.map(({ title, text }, i) => (
          <li key={title} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
            <span className="demo-scale-node">
              {i < step ? <CheckCircle2 className="icon" /> : i + 1}
            </span>
            <div>
              <h4>{title}</h4>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
