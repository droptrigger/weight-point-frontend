# WeighPoint — фронтенд

Панель для отчётов о взвешивании и справочников (машины, полигоны, перевозчики, виды отходов, пользователи).

Стек: React 19, TypeScript, Vite, React Router, TanStack Query, oxlint, Prettier.

## Запуск

```sh
cp .env.example .env   # VITE_API_URL — адрес API
npm install
npm run dev
```

## Docker

```sh
cp .env.example .env   # VITE_API_URL встраивается в бандл при сборке образа
docker compose up -d --build
```

Приложение раздаёт nginx на `http://localhost:8080` (порт меняется через `FRONTEND_PORT`). После смены `VITE_API_URL` образ нужно пересобрать.

## Скрипты

| Команда                | Что делает                       |
| ---------------------- | -------------------------------- |
| `npm run dev`          | dev-сервер                       |
| `npm run build`        | проверка типов и сборка в `dist` |
| `npm run typecheck`    | только проверка типов            |
| `npm run lint`         | oxlint                           |
| `npm run format`       | Prettier по `src`                |
| `npm run format:check` | проверка форматирования          |

## Структура `src`

```
app/        точка сборки: роутер, QueryClient, провайдеры
features/   по папке на сущность: api.ts (запросы и типы), hooks.ts (TanStack Query), страницы и формы
  auth/     вход, выход, роли и права (permissions.ts), RequireAuth / RequirePermission
widgets/    крупные блоки страниц (AppLayout)
shared/
  api/      http-клиент с обновлением токена, сессия
  lib/      хуки и утилиты без UI
  ui/       общие компоненты: ListPage, DetailPage, Modal, Form, Select, …
styles/     CSS по компонентам, токены в tokens.css
```

Права в интерфейсе описаны в `features/auth/permissions.ts` и влияют только на видимость; проверку делает сервер.
