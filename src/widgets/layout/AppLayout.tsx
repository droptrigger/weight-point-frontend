import type { CSSProperties } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  Info,
  LogOut,
  MapPin,
  Recycle,
  Send,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { CurrentUser } from '@/features/auth/CurrentUser'
import { useMe } from '@/features/auth/hooks'
import { LogoutConfirm } from '@/features/auth/LogoutConfirm'
import {
  hasPermission,
  useOwnLandfillId,
  useRole,
  type Permission,
} from '@/features/auth/permissions'
import { cx } from '@/shared/lib/cx'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { HeaderAccountContext } from '@/shared/ui/headerAccount'
import { DeliveryTruck, FolderOpenSide, HandTruck } from '@/shared/ui/icons'
import { LogoMark } from '@/shared/ui/Logo'
import { Skeleton } from '@/shared/ui/Skeleton'
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch'
import { Tooltip } from '@/shared/ui/Tooltip'
import { useSidebarResize } from './useSidebarResize'

type NavItem = { to: string; icon: LucideIcon; label: string; permission?: Permission }

const NAV: NavItem[] = [
  { to: '/reports', icon: FolderOpenSide, label: 'Отчёты' },
  { to: '/analytics', icon: BarChart3, label: 'Аналитика', permission: 'analytics.view' },
  { to: '/vehicles', icon: DeliveryTruck, label: 'Машины' },
  { to: '/landfills', icon: MapPin, label: 'Полигоны', permission: 'landfills.view' },
  { to: '/carriers', icon: HandTruck, label: 'Перевозчики' },
  { to: '/waste-types', icon: Recycle, label: 'Виды отходов' },
  { to: '/users', icon: Users, label: 'Пользователи', permission: 'users.view' },
  { to: '/sending', icon: Send, label: 'Настройки ФГИС', permission: 'sending.manage' },
]

export function AppLayout() {
  const role = useRole()
  const { data: me, isPending } = useMe()
  const logout = useDisclosure()
  const sidebar = useSidebarResize()
  // Подсказка ручки видна при наведении на всю высоту кромки, а не только на саму ручку
  const edgeHover = useDisclosure()

  const ownLandfillId = useOwnLandfillId()

  const items = NAV.filter((item) => !item.permission || hasPermission(role, item.permission))
  // Администрация видит не раздел «Полигоны», а страницу своего полигона: на ней правка и сотрудники
  if (ownLandfillId && hasPermission(role, 'landfills.own')) {
    const at = items.findIndex((item) => item.to === '/vehicles') + 1
    items.splice(at, 0, { to: `/landfills/${ownLandfillId}`, icon: MapPin, label: 'Мой полигон' })
  }
  // У разработчика своего полигона нет, он работает со всеми
  const landfillName = me && (me.landfill?.name ?? 'Все полигоны')

  const logo = (
    <span className="logo">
      <LogoMark />
    </span>
  )

  return (
    <HeaderAccountContext value={<CurrentUser />}>
      <div
        className={cx(
          'layout',
          sidebar.collapsed && 'layout--collapsed',
          sidebar.dragging && 'layout--resizing',
        )}
        // Ширина меню в переменной: по ней же считают ширину панели отчёта
        style={{ '--sidebar-w': `${sidebar.width}px` } as CSSProperties}
      >
        <aside className="sidebar">
          <div className="brand">
            {/* В свёрнутом меню подписи под логотипом нет: полигон виден в подсказке */}
            {sidebar.collapsed && landfillName ? (
              <Tooltip
                content={
                  <>
                    <span className="tooltip-title">Полигон</span>
                    <span className="tooltip-text">{landfillName}</span>
                  </>
                }
              >
                {logo}
              </Tooltip>
            ) : (
              logo
            )}
            <div className="brand-info">
              <span className="brand-text">Полигон</span>
              {me ? (
                <span className="brand-landfill" title={me.landfill?.name}>
                  {landfillName}
                </span>
              ) : (
                isPending && <Skeleton width={100} height={12} />
              )}
            </div>
          </div>

          <nav className="nav">
            {items.map(({ to, icon: Icon, label }) => (
              // NavLink сам добавляет класс active текущему разделу
              <NavLink key={to} to={to} className="nav-item">
                <Icon className="icon" />
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="nav-bottom">
            <ThemeSwitch />
            <NavLink to="/about" className="nav-item">
              <Info className="icon" />
              <span className="nav-label">О системе</span>
            </NavLink>
            <button type="button" className="nav-item nav-logout" onClick={logout.show}>
              <LogOut className="icon" />
              <span className="nav-label">Выйти</span>
            </button>
          </div>

          {/* Кромка меню: нажать или потянуть мышью, стрелки и Enter — с клавиатуры */}
          <div
            className={cx('sidebar-resize', sidebar.dragging && 'dragging')}
            role="separator"
            aria-orientation="vertical"
            aria-label="Ширина меню"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={sidebar.collapsed ? 0 : 1}
            aria-valuetext={sidebar.collapsed ? 'Свёрнуто' : 'Развёрнуто'}
            tabIndex={0}
            onMouseEnter={edgeHover.show}
            onMouseLeave={edgeHover.hide}
            {...sidebar.handleProps}
          />
          {/* Ручка снаружи меню: нажать — свернуть или развернуть, потянуть — изменить ширину */}
          <Tooltip
            className={cx('sidebar-grip', sidebar.dragging && 'dragging')}
            hidden={sidebar.dragging}
            active={edgeHover.open}
            content={
              <span className="tooltip-text">
                {sidebar.collapsed
                  ? 'Нажмите, чтобы развернуть, потяните, чтобы изменить ширину'
                  : 'Нажмите, чтобы свернуть, потяните, чтобы изменить ширину'}
              </span>
            }
          >
            <span className="sidebar-grip-hit" {...sidebar.gripProps} />
          </Tooltip>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <LogoutConfirm open={logout.open} onClose={logout.hide} />
    </HeaderAccountContext>
  )
}
