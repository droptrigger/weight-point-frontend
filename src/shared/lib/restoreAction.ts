import type { RestoreAction } from '@/shared/ui/EntityActions'

type RestoreMutation = {
  mutate: (id: string) => void
  isPending: boolean
  error: Error | null
}

// Кнопка «Восстановить» нужна только у удалённой записи и только при праве на восстановление
export const restoreAction = (
  mutation: RestoreMutation,
  id: string,
  enabled: boolean,
): RestoreAction | undefined =>
  enabled
    ? {
        run: () => mutation.mutate(id),
        loading: mutation.isPending,
        error: mutation.error?.message,
      }
    : undefined
