import { useState } from 'react'
import { ConfirmModal } from '@/shared/ui/Modal'
import { logout } from './api'

type Props = { open: boolean; onClose: () => void }

// Подтверждение выхода из аккаунта
export function LogoutConfirm({ open, onClose }: Props) {
  const [leaving, setLeaving] = useState(false)

  const leave = async () => {
    setLeaving(true)
    await logout() // RequireAuth сам уведёт на /login
  }

  return (
    <ConfirmModal
      open={open}
      title="Выйти из аккаунта?"
      text="Чтобы продолжить работу, нужно будет войти снова."
      confirmText="Выйти"
      loading={leaving}
      onClose={onClose}
      onConfirm={leave}
    />
  )
}
