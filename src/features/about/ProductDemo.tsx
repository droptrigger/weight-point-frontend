import { useState, type KeyboardEvent } from 'react'
import {
  BarChart3,
  MousePointerClick,
  Smartphone,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { DeliveryTruck, FolderOpenSide, HandTruck } from '@/shared/ui/icons'
import { LogoMark } from '@/shared/ui/Logo'
import { DemoAnalytics } from './DemoAnalytics'
import { DemoCarriers } from './DemoCarriers'
import { DemoReports } from './DemoReports'
import { DemoScale } from './DemoScale'
import { DemoUsers } from './DemoUsers'
import { DemoVehicles } from './DemoVehicles'

type Tab = 'reports' | 'scale' | 'analytics'
// Разделы окна: вкладки над ним и ещё три, которые открываются только из меню слева
type Screen = Tab | 'vehicles' | 'carriers' | 'users'

const TABS: { value: Tab; label: string; icon: LucideIcon; hint: string }[] = [
  {
    value: 'reports',
    label: 'Проверка отчётов',
    icon: FolderOpenSide,
    hint: 'Найдите отчёт по номеру, откройте его или отметьте несколько и примите – принятые уйдут в ФГИС УТКО',
  },
  {
    value: 'scale',
    label: 'Мобильное приложение',
    icon: Smartphone,
    hint: 'Сфотографируйте машину и табло весов – вес распознаётся с фото, вес отходов считается сам',
  },
  {
    value: 'analytics',
    label: 'Аналитика',
    icon: BarChart3,
    hint: 'Переключайте период графика и наводите курсор на точки и дни календаря',
  },
]

const SCREEN_HINTS: Record<Exclude<Screen, Tab>, string> = {
  vehicles: 'Ищите машину по номеру и фильтруйте по перевозчику',
  carriers: 'Нажмите на перевозчика, чтобы увидеть его машины',
  users: 'Оператор взвешивает, контролер проверяет, администрация смотрит на графики',
}

// Пункты бокового меню в окне-демо
const NAV: { icon: LucideIcon; label: string; screen: Screen }[] = [
  { icon: FolderOpenSide, label: 'Отчёты', screen: 'reports' },
  { icon: BarChart3, label: 'Аналитика', screen: 'analytics' },
  { icon: DeliveryTruck, label: 'Машины', screen: 'vehicles' },
  { icon: HandTruck, label: 'Перевозчики', screen: 'carriers' },
  { icon: Users, label: 'Пользователи', screen: 'users' },
]

// Интерактивная демонстрация: окно системы с вкладками. Данные выдуманные, на сервер ничего не уходит
export function ProductDemo() {
  const [screen, setScreen] = useState<Screen>('reports')
  // Перевозчик, с карточки которого открыли машины: их список сразу отфильтрован
  const [carrier, setCarrier] = useState<string>()
  const tab = TABS.find((t) => t.value === screen)
  // Пока открыт раздел из меню, ни одна вкладка не выбрана, но в фокус попадает первая
  const focusable = tab ?? TABS[0]
  const hint = tab ? tab.hint : SCREEN_HINTS[screen as Exclude<Screen, Tab>]

  const open = (next: Screen, nextCarrier?: string) => {
    setScreen(next)
    setCarrier(nextCarrier)
  }

  // Стрелки переключают вкладки, как в системных вкладках
  const onKeyDown = (e: KeyboardEvent) => {
    const shift = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (!shift) return
    const i = (TABS.indexOf(focusable) + shift + TABS.length) % TABS.length
    open(TABS[i].value)
    document.getElementById(`demo-tab-${TABS[i].value}`)?.focus()
  }

  return (
    <div className="demo">
      <div className="demo-tabs" role="tablist" aria-label="Демонстрация" onKeyDown={onKeyDown}>
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            id={`demo-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={screen === value}
            aria-controls="demo-panel"
            tabIndex={focusable.value === value ? 0 : -1}
            className={cx('demo-tab', screen === value && 'active')}
            onClick={() => open(value)}
          >
            <Icon className="icon" />
            {label}
          </button>
        ))}
      </div>

      <div className="demo-window">
        {/* Заголовок окна macOS: «светофор» слева */}
        <div className="demo-titlebar" aria-hidden="true">
          <span className="demo-dots">
            <i className="demo-dot-close" />
            <i className="demo-dot-min" />
            <i className="demo-dot-zoom" />
          </span>
        </div>

        <div
          id="demo-panel"
          role="tabpanel"
          aria-labelledby={tab && `demo-tab-${tab.value}`}
          aria-label={tab ? undefined : 'Демонстрация'}
          className={cx('demo-screen', `demo-screen--${screen}`)}
        >
          {screen !== 'scale' && (
            <nav className="demo-nav" aria-label="Меню системы (демонстрация)">
              <span className="logo">
                <LogoMark />
              </span>
              {NAV.map(({ icon: Icon, label, screen: target }) => (
                <button
                  key={label}
                  type="button"
                  className={cx('demo-nav-item', target === screen && 'active')}
                  aria-current={target === screen ? 'page' : undefined}
                  onClick={() => open(target)}
                >
                  <Icon className="icon" />
                  <span>{label}</span>
                </button>
              ))}
              {/* Учётная запись внизу меню: посетитель как будто уже вошёл в систему */}
              <div className="demo-account">
                <span className="user-avatar" aria-hidden="true">
                  <UserRound className="icon" />
                </span>
                <span className="demo-account-info">
                  <span className="demo-account-name">Ваш аккаунт</span>
                  <span className="demo-account-role">Администрация</span>
                </span>
              </div>
            </nav>
          )}
          {/* key: при смене раздела демо начинается заново и проигрывает появление */}
          <div className="demo-content" key={`${screen}-${carrier ?? ''}`}>
            {screen === 'reports' && <DemoReports />}
            {screen === 'scale' && <DemoScale />}
            {screen === 'analytics' && <DemoAnalytics />}
            {screen === 'vehicles' && <DemoVehicles carrier={carrier} />}
            {screen === 'carriers' && <DemoCarriers onOpen={(name) => open('vehicles', name)} />}
            {screen === 'users' && <DemoUsers />}
          </div>
        </div>
      </div>

      <p className="demo-hint">
        <MousePointerClick className="icon" />
        {hint}
      </p>
      <p className="demo-note">* Показана небольшая часть возможностей системы, данные условные</p>
    </div>
  )
}
