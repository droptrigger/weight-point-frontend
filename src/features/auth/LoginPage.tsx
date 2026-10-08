import { useState, type SyntheticEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { session, useIsAuthed } from '@/shared/api/session'
import { cx } from '@/shared/lib/cx'
import { fieldError } from '@/shared/lib/fieldError'
import { Button } from '@/shared/ui/Button'
import { DocumentTitle } from '@/shared/ui/DocumentTitle'
import { Field, FormError, TextField } from '@/shared/ui/Form'
import { LogoFull } from '@/shared/ui/Logo'
import { authApi } from './api'

export function LoginPage() {
  const authed = useIsAuthed()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (tokens) => session.set(tokens),
  })
  const error = (key: 'email' | 'password') => fieldError(login.error, {}, key)

  if (authed) return <Navigate to="/" replace />

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    login.mutate({ email: email.trim(), password })
  }

  return (
    <div className="auth">
      <DocumentTitle title="Вход" />
      <div className="auth-card">
        <div className="auth-brand">
          {/* Название уже нарисовано в логотипе, поэтому оно в подписи */}
          <h1 className="auth-logo">
            <LogoFull label="Точка Взвешивания" />
          </h1>
        </div>

        <form className="auth-form" onSubmit={submit} noValidate>
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="Введите email"
            value={email}
            onChange={setEmail}
            error={error('email')}
          />

          <Field id="password" label="Пароль" error={error('password')}>
            <div className="pw">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Введите пароль"
                className={cx('input', error('password') && 'invalid')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShow((v) => !v)}
              >
                {show ? <EyeOff className="icon" /> : <Eye className="icon" />}
              </button>
            </div>
          </Field>

          <FormError error={login.error} />
          <Button type="submit" loading={login.isPending}>
            Войти
          </Button>
        </form>

        <Link className="auth-about" to="/about">
          О системе
        </Link>
      </div>
    </div>
  )
}
