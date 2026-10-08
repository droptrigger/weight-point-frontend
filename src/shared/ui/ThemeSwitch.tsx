import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { cx } from '@/shared/lib/cx'
import { theme, useTheme, type ThemeChoice } from '@/shared/lib/theme'

const CHOICES: { value: ThemeChoice; icon: LucideIcon; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'dark', icon: Moon, label: 'Тёмная' },
  { value: 'system', icon: Monitor, label: 'Как в системе' },
]

// Переключатель темы в боковом меню: три кнопки-иконки, выбранная подсвечена
export function ThemeSwitch() {
  const current = useTheme()

  return (
    <div className="theme-switch" role="radiogroup" aria-label="Тема оформления">
      {CHOICES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          className={cx('theme-option', current === value && 'active')}
          title={label}
          onClick={() => theme.set(value)}
        >
          <Icon className="icon" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
