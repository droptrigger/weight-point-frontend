import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/http'
import { session } from '@/shared/api/session'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Ответ сервера с ошибкой повторный запрос не изменит, поэтому повтор только для сетевых сбоев
      retry: (failureCount, error) => !(error instanceof ApiError) && failureCount < 2,
    },
  },
})

// После выхода кеш чужих данных не должен остаться
session.subscribe(() => {
  if (!session.get()) queryClient.clear()
})
