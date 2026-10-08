import { useState } from 'react'
import { fieldError, type LocalErrors } from './fieldError'

// Состояние формы в модальном окне: значения, локальные ошибки проверки и ошибки сервера по полям.
// K — ключи ошибок: обычно поля формы, но бывают и другие поля запроса (например, фото)
export function useForm<F extends object, K extends string = Extract<keyof F, string>>(
  initial: F | (() => F),
  serverError: unknown,
) {
  const [form, setForm] = useState(initial)
  const [local, setLocal] = useState<LocalErrors<K>>({})

  const clearErrors = (keys: string[]) =>
    setLocal((l) => ({ ...l, ...Object.fromEntries(keys.map((key) => [key, undefined])) }))

  // Изменённые поля больше не подсвечиваются ошибкой
  const update = (patch: Partial<F>) => {
    setForm((f) => ({ ...f, ...patch }))
    clearErrors(Object.keys(patch))
  }

  return {
    form,
    update,
    set:
      <Key extends keyof F>(key: Key) =>
      (value: F[Key]) =>
        update({ [key]: value } as unknown as Partial<F>),
    error: (key: K) => fieldError(serverError, local, key),
    clearError: (key: K) => clearErrors([key]),
    // Показывает ошибки проверки; true — ошибок нет, можно отправлять
    validate: (errors: LocalErrors<K>) => {
      setLocal(errors)
      return Object.keys(errors).length === 0
    },
  }
}
