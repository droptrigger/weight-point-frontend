import type { SyntheticEvent } from 'react'
import { useCan } from '@/features/auth/permissions'
import { LandfillField } from '@/features/landfills/LandfillField'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { useForm } from '@/shared/lib/useForm'
import { FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import type { UserDetails } from './api'
import { useSaveUser } from './hooks'

type Props = { open: boolean; user?: UserDetails; onClose: () => void }
type Form = {
  email: string
  password: string
  firstName: string
  lastName: string
  landfillId: string
}

const initialForm = (user?: UserDetails): Form => ({
  email: '',
  password: '',
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  landfillId: user?.landfill?.id ?? '',
})

export function UserFormModal({ open, user, onClose }: Props) {
  return (
    <Modal
      open={open}
      title={user ? 'Редактирование пользователя' : 'Новый пользователь'}
      onClose={onClose}
    >
      <UserForm user={user} onClose={onClose} />
    </Modal>
  )
}

function UserForm({ user, onClose }: Omit<Props, 'open'>) {
  const save = useSaveUser()
  const { form, set, error, validate } = useForm(() => initialForm(user), save.error)
  // Полигон назначает и меняет только разработчик; остальные работают внутри своего полигона
  const chooseLandfill = useCan('landfills.assign')

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const errors: LocalErrors<keyof Form> = {}
    if (!user) {
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Некорректный email'
      if (!form.password) errors.password = 'Заполните поле'
    }
    if (!form.firstName.trim()) errors.firstName = 'Заполните поле'
    if (chooseLandfill && !form.landfillId) errors.landfillId = 'Выберите полигон'
    if (!validate(errors)) return

    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || null,
      landfillId: chooseLandfill ? form.landfillId : undefined,
    }
    save.mutate(
      user ? { id: user.id, data } : { data, email: form.email.trim(), password: form.password },
      { onSuccess: onClose },
    )
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      {!user && (
        <TextField
          id="user-email"
          label="Email"
          type="email"
          autoComplete="off"
          autoFocus
          placeholder="mail@example.com"
          value={form.email}
          onChange={set('email')}
          error={error('email')}
        />
      )}
      <TextField
        id="user-first-name"
        label="Имя"
        half
        autoComplete="off"
        autoFocus={Boolean(user)}
        value={form.firstName}
        onChange={set('firstName')}
        error={error('firstName')}
      />
      <TextField
        id="user-last-name"
        label="Фамилия"
        half
        autoComplete="off"
        value={form.lastName}
        onChange={set('lastName')}
        error={error('lastName')}
      />
      {!user && (
        <TextField
          id="user-password"
          label="Пароль"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={error('password')}
        />
      )}
      {chooseLandfill && (
        <LandfillField
          id="user-landfill"
          value={form.landfillId}
          onChange={set('landfillId')}
          error={error('landfillId')}
        />
      )}
      <FormError error={save.error} />
      <FormActions
        submitText={user ? 'Сохранить' : 'Добавить'}
        pending={save.isPending}
        onCancel={onClose}
      />
    </form>
  )
}
