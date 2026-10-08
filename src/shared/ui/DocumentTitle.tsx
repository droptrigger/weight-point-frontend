import { useEffect } from 'react'

// Заголовок вкладки браузера — название раздела: «Машины». Элемент <title> из React 19 здесь
// не подходит: браузер берёт первый <title> в <head>, а это статический из index.html
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title
  }, [title])

  return null
}
