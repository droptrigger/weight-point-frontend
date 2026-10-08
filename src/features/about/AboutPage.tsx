import { Link } from 'react-router-dom'
import {
  ArrowDown,
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  PackageOpen,
  Send,
  ShieldCheck,
  Smartphone,
  Upload,
  Weight,
  type LucideIcon,
} from 'lucide-react'
import { useIsAuthed } from '@/shared/api/session'
import { DocumentTitle } from '@/shared/ui/DocumentTitle'
import { DeliveryTruck } from '@/shared/ui/icons'
import { LogoFull, LogoMark } from '@/shared/ui/Logo'
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch'
import { ProductDemo } from './ProductDemo'
import { RequestSection } from './RequestSection'

// Год в подвале: страница живёт недолго, пересчитывать при каждом рендере незачем
const YEAR = new Date().getFullYear()

// Якоря в шапке страницы
const SECTIONS = [
  { id: 'demo', label: 'Демо' },
  { id: 'features', label: 'Возможности' },
  { id: 'how', label: 'Как это работает' },
  { id: 'request', label: 'Контакты' },
]

type Item = { icon: LucideIcon; title: string; text: string }

// Текст-заглушка: заменить на согласованное описание системы
const FEATURES: Item[] = [
  {
    icon: Smartphone,
    title: 'Мобильное приложение для весовой',
    text: 'Оператор фиксирует въезд и выезд машины прямо на весах, даже без связи: данные уйдут на сервер, как только появится сеть.',
  },
  {
    icon: Camera,
    title: 'Фотофиксация каждого взвешивания',
    text: 'К отчёту прикладываются фото машины, брутто и тары. Спорные ситуации решаются по снимкам, а не по памяти.',
  },
  {
    icon: CheckCircle2,
    title: 'Проверка контролером',
    text: 'Отчёты проходят проверку перед отправкой: можно подтвердить или отклонить сразу пачку записей.',
  },
  {
    icon: Upload,
    title: 'Отправка в ФГИС УТКО',
    text: 'Подтверждённые отчёты по нужным видам отходов автоматически передаются в государственную систему.',
  },
  {
    icon: BarChart3,
    title: 'Аналитика по полигонам',
    text: 'Сколько отходов принято, какие машины возят чаще всего и какой средний вес отходов в отчёте – всё на одной странице.',
  },
  {
    icon: DeliveryTruck,
    title: 'Свои справочники у каждого полигона',
    text: 'Машины, перевозчики, марки и виды отходов ведутся для каждого полигона отдельно и не путаются между собой.',
  },
]

const BENEFITS: Item[] = [
  {
    icon: Clock,
    title: 'Меньше ручной работы',
    text: 'Не нужно переписывать журналы весовой в таблицы – отчёты появляются в системе сами.',
  },
  {
    icon: ShieldCheck,
    title: 'Прозрачность и контроль',
    text: 'Видно, кто и когда изменил отчёт, а отправленные записи защищены от правок.',
  },
  {
    icon: BarChart3,
    title: 'Данные для решений',
    text: 'Объёмы по полигонам, перевозчикам и видам отходов доступны в любой момент.',
  },
]

const STEPS: Item[] = [
  {
    icon: Weight,
    title: 'Въезд на весы',
    text: 'Оператор взвешивает гружёную машину и делает фото',
  },
  {
    icon: PackageOpen,
    title: 'Разгрузка и тара',
    text: 'После разгрузки фиксируется тара, система сама считает нетто',
  },
  {
    icon: ClipboardCheck,
    title: 'Проверка',
    text: 'Контролер полигона сверяет отчёт с фото и подтверждает его',
  },
  {
    icon: Send,
    title: 'Отправка в ФГИС УТКО',
    text: 'Подтверждённый отчёт уходит в государственную систему',
  },
]

export function AboutPage() {
  const authed = useIsAuthed()

  return (
    <div className="about">
      <DocumentTitle title="О системе" />
      <header className="about-bar">
        <div className="about-bar-inner">
          <Link to="/" className="about-brand">
            <span className="logo">
              <LogoMark />
            </span>
            <span className="brand-text">Точка Взвешивания</span>
          </Link>
          <nav className="about-nav" aria-label="Разделы страницы">
            {SECTIONS.map(({ id, label }) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="about-bar-actions">
            <ThemeSwitch />
            <Link className="btn btn--ghost about-login" to={authed ? '/' : '/login'}>
              {authed ? 'Вернуться в систему' : 'Войти'}
            </Link>
            <a className="btn btn--primary about-bar-request" href="#request">
              Получить доступ
            </a>
          </div>
        </div>
      </header>

      <main className="about-body">
        <section className="about-hero">
          {/* Название уже нарисовано в логотипе, поэтому оно в подписи */}
          <LogoFull className="about-hero-logo" label="Точка Взвешивания" />
          <h1>Учёт взвешиваний на полигонах ТКО</h1>
          <p>
            «Точка Взвешивания» соединяет весовую, контроль и отчётность: каждое взвешивание
            фиксируется с фото, проверяется и передаётся в ФГИС УТКО без ручного переноса данных.
          </p>
          <div className="about-hero-actions">
            <a className="btn btn--primary" href="#request">
              Получить доступ
            </a>
            <a className="btn btn--soft" href="#demo">
              Посмотреть, как это работает
              <ArrowDown className="icon" />
            </a>
          </div>
        </section>

        <section className="about-demo" id="demo" aria-label="Демонстрация системы">
          <ProductDemo />
        </section>

        <h2 className="about-heading" id="features">
          Возможности
        </h2>
        <div className="about-grid about-reveal">
          {FEATURES.map((item) => (
            <AboutCard key={item.title} {...item} />
          ))}
        </div>

        <h2 className="about-heading" id="how">
          Как это работает
        </h2>
        <ol className="about-roadmap about-reveal">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="about-roadmap-step">
              <span className="about-roadmap-node">
                <Icon className="icon" />
              </span>
              <span className="about-roadmap-num">Шаг {i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <h2 className="about-heading">Преимущества</h2>
        <div className="about-grid about-grid-3 about-reveal">
          {BENEFITS.map((item) => (
            <AboutCard key={item.title} {...item} />
          ))}
        </div>

        <RequestSection />
      </main>

      <footer className="about-footer">
        <div className="about-footer-inner">
          <span className="logo">
            <LogoMark />
          </span>
          <span>© {YEAR} Точка Взвешивания</span>
        </div>
      </footer>
    </div>
  )
}

function AboutCard({ icon: Icon, title, text }: Item) {
  return (
    <div className="about-card">
      <span className="about-card-icon">
        <Icon className="icon" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
