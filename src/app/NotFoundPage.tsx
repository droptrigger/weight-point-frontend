import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, House, MapPinOff } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

// Неизвестный адрес внутри приложения: сайдбар остаётся, чтобы можно было уйти в нужный раздел
export function NotFoundPage() {
  const navigate = useNavigate()
  const { pathname, key } = useLocation()
  // key === 'default' — страницу открыли напрямую, назад в истории приложения идти некуда
  const canGoBack = key !== 'default'

  return (
    <>
      <PageHeader title="Страница не найдена" />

      <div className="content-body">
        <EmptyState
          icon={MapPinOff}
          code="404"
          title="Такой страницы нет"
          description={
            <>
              Адрес <code className="empty-state-path">{pathname}</code> не существует или был
              перемещён. Проверьте ссылку или перейдите в один из разделов.
            </>
          }
          actions={
            <>
              <Link className="btn btn--primary" to="/" replace>
                <House className="icon" />
                На главную
              </Link>
              {canGoBack && (
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="icon" />
                  Назад
                </Button>
              )}
            </>
          }
        />
      </div>
    </>
  )
}
