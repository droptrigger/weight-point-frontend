import { use, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useBackTarget } from '@/shared/lib/backNavigation'
import { DocumentTitle } from './DocumentTitle'
import { HeaderAccountContext } from './headerAccount'

// backTo — куда вести «Назад», если на страницу пришли не по ссылке из приложения
type Props = { title: string; backTo?: string; actions?: ReactNode }

export function PageHeader({ title, backTo, actions }: Props) {
  const back = useBackTarget(backTo ?? '')
  const account = use(HeaderAccountContext)

  return (
    <header className="page-header">
      <DocumentTitle title={title} />
      <div className="header-left">
        {backTo && (
          <Link className="back" to={back.to} state={back.state} aria-label="Назад">
            <ArrowLeft className="icon" />
          </Link>
        )}
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        {actions}
        {account}
      </div>
    </header>
  )
}
