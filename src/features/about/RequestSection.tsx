import { useState, type SyntheticEvent } from 'react'
import { CheckCircle2, Clock, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/Form'

type Contact = { icon: LucideIcon; label: string; value: string; href?: string }

// Контакты-заглушки: заменить на настоящие
const CONTACTS: Contact[] = [
  { icon: Phone, label: 'Телефон', value: '+7 (800) 000-00-00', href: 'tel:+78000000000' },
  { icon: Mail, label: 'Email', value: 'info@example.ru', href: 'mailto:info@example.ru' },
  { icon: MapPin, label: 'Адрес', value: 'г. Москва, ул. Примерная, д. 1, офис 100' },
  { icon: Clock, label: 'Часы работы', value: 'Пн–Пт, 9:00–18:00 (МСК)' },
]

type Errors = { email?: string; inn?: string }

// ИНН по составу: код региона, код налоговой, номер записи и контрольные цифры —
// 12 34 56789 0 у организаций и 12 34 567890 12 у физлиц и ИП
function formatInn(digits: string) {
  const record = digits.length > 10 ? 6 : 5
  return [
    digits.slice(0, 2),
    digits.slice(2, 4),
    digits.slice(4, 4 + record),
    digits.slice(4 + record),
  ]
    .filter(Boolean)
    .join(' ')
}

function validate(email: string, inn: string): Errors {
  const errors: Errors = {}
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Введите корректный email'
  if (!/^(\d{10}|\d{12})$/.test(inn)) errors.inn = 'ИНН состоит из 10 или 12 цифр'
  return errors
}

export function RequestSection() {
  const [email, setEmail] = useState('')
  const [inn, setInn] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  // Заглушка: заявка пока никуда не отправляется
  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const next = validate(email.trim(), inn.trim())
    setErrors(next)
    if (!next.email && !next.inn) setSent(true)
  }

  return (
    <section className="about-request" id="request">
      <div className="about-request-form">
        <h2>Получить доступ</h2>
        <p className="about-request-lead">
          Оставьте email и ИНН организации – мы свяжемся с вами, расскажем о подключении и
          подготовим демо-доступ.
        </p>

        {sent ? (
          <div className="about-request-done">
            <CheckCircle2 className="icon" />
            Спасибо! Заявка принята, мы ответим на {email.trim()} в ближайшее время.
          </div>
        ) : (
          <form className="about-request-fields" onSubmit={submit} noValidate>
            <TextField
              id="request-email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="name@company.ru"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />
            <TextField
              id="request-inn"
              label="ИНН"
              inputMode="numeric"
              autoComplete="off"
              placeholder="10 или 12 цифр"
              value={formatInn(inn)}
              onChange={(v) => setInn(v.replace(/\D/g, '').slice(0, 12))}
              error={errors.inn}
            />
            <Button type="submit">Отправить заявку</Button>
          </form>
        )}
      </div>

      <div className="about-contacts">
        <h3>Контакты</h3>
        <ul>
          {CONTACTS.map(({ icon: Icon, label, value, href }) => (
            <li key={label}>
              <Icon className="icon" />
              <div>
                <div className="muted">{label}</div>
                {href ? <a href={href}>{value}</a> : value}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
