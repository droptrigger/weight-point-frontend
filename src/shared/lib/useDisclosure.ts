import { useState } from 'react'

// Открыто или закрыто (окно, подтверждение)
export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial)

  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
  }
}
