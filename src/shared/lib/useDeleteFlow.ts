import { useNavigate } from 'react-router-dom'
import { useBackTarget } from './backNavigation'
import { useDisclosure } from './useDisclosure'

type DeleteMutation<Id> = {
  mutate: (id: Id, options: { onSuccess: () => void }) => void
  reset: () => void
  isPending: boolean
  error: Error | null
}

export type DeleteFlow<Id> = {
  open: boolean
  show: () => void
  close: () => void
  confirm: (id: Id) => void
  loading: boolean
  error?: string
}

// Окно подтверждения удаления: после успеха возвращает туда же, куда «Назад» (по умолчанию — на список).
// onDeleted заменяет переход, если запись открыта не отдельной страницей (например, в панели списка)
export function useDeleteFlow<Id>(
  mutation: DeleteMutation<Id>,
  backTo: string,
  onDeleted?: () => void,
): DeleteFlow<Id> {
  const navigate = useNavigate()
  const back = useBackTarget(backTo)
  const dialog = useDisclosure()

  return {
    open: dialog.open,
    show: dialog.show,
    close: () => {
      dialog.hide()
      mutation.reset()
    },
    confirm: (id) =>
      mutation.mutate(id, {
        onSuccess: () => {
          if (onDeleted) {
            dialog.hide()
            onDeleted()
          } else navigate(back.to, { replace: true, state: back.state })
        },
      }),
    loading: mutation.isPending,
    error: mutation.error?.message,
  }
}
