import { Link, type LinkProps } from 'react-router-dom'
import { useForwardState } from '@/shared/lib/backNavigation'

// Ссылка на страницу сущности: «Назад» на ней вернёт сюда же, с фильтрами и страницей списка
export function EntityLink(props: Omit<LinkProps, 'state'>) {
  return <Link {...props} state={useForwardState()} />
}
