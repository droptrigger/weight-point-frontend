import { useEffect, useRef, useState } from 'react'
import { CircleX, RotateCcw } from 'lucide-react'
import type { ReviewStatusCode } from '@/features/reports/api'
import { ReportStatusBadge } from '@/features/reports/ReportStatusBadge'
import { REVIEW_ACTIONS } from '@/features/reports/reviewActions'
import { canReviewTo, isReviewable, STATUS_OPTIONS } from '@/features/reports/statuses'
import { cx } from '@/shared/lib/cx'
import { formatKg, plural } from '@/shared/lib/format'
import { toggled } from '@/shared/lib/math'
import { PlateNumber } from '@/shared/ui/Badges'
import { Button } from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Select } from '@/shared/ui/Select'
import { DEMO_REPORTS, matchesPlate, type DemoReport } from './demoData'
import { DemoReportCard } from './DemoReportCard'
import { demoStatus } from './demoStatus'

// Через сколько принятый отчёт «уходит» в ФГИС УТКО
const SEND_DELAY = 1600

const REPORT_FORMS: [string, string, string] = ['отчёт', 'отчёта', 'отчётов']

// Список отчётов как в системе: поиск по номеру и фильтр по статусу, можно отметить строки,
// принять или отклонить их, а принятые сами «отправятся» в ФГИС УТКО.
// Клик по строке открывает карточку отчёта. Ничего не уходит на сервер
export function DemoReports() {
  const [reports, setReports] = useState(DEMO_REPORTS)
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [search, setSearch] = useState('')
  const [status, setStatusFilter] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  // Сколько раз менялся статус строки: ключ бейджа меняется, и он заново проигрывает анимацию
  const [versions, setVersions] = useState<Record<number, number>>({})
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const visible = reports.filter(
    (r) => matchesPlate(search, r.plate, r.region) && (!status || r.status === status),
  )
  const reviewable = visible.filter((r) => isReviewable(r.status))
  const chosen = visible.filter((r) => selected.has(r.id))
  const count = (to: ReviewStatusCode) => chosen.filter((r) => canReviewTo(to, r.status)).length
  // «Принять» видно всегда, возврат на проверку и повтор отправки — только если такие отчёты выбраны
  const actions = REVIEW_ACTIONS.map((a) => ({ ...a, count: count(a.to) })).filter(
    (a) => a.to === 'accepted' || a.count > 0,
  )
  const toReject = chosen.filter((r) => canReviewTo('rejected', r.status)).length
  const changed = reports.some((r, i) => r.status !== DEMO_REPORTS[i].status)

  const toggle = (id: number) => setSelected((prev) => toggled(prev, id))

  const toggleAll = () =>
    setSelected(
      selected.size === reviewable.length ? new Set() : new Set(reviewable.map((r) => r.id)),
    )

  // from — из какого статуса переводить: принятый отчёт могли успеть отклонить
  const setStatus = (ids: number[], status: DemoReport['status'], from?: DemoReport['status']) => {
    setReports((prev) =>
      prev.map((r) => (ids.includes(r.id) && (!from || r.status === from) ? { ...r, status } : r)),
    )
    setVersions((prev) => {
      const next = { ...prev }
      for (const id of ids) next[id] = (next[id] ?? 0) + 1
      return next
    })
  }

  // Виды отходов демо-полигона отправляются в ФГИС УТКО, поэтому принятый отчёт ждёт отправки
  const review = (ids: number[], to: ReviewStatusCode) => {
    const next = to === 'accepted' ? 'awaiting_sending' : to
    setStatus(ids, next)
    if (next === 'awaiting_sending' && ids.length) {
      timers.current.push(
        window.setTimeout(() => setStatus(ids, 'sent', 'awaiting_sending'), SEND_DELAY),
      )
    }
  }

  const reviewChosen = (to: ReviewStatusCode) => {
    review(
      chosen.filter((r) => canReviewTo(to, r.status)).map((r) => r.id),
      to,
    )
    setSelected(new Set())
  }

  // Как в системе: при смене фильтров выделение снимается
  const filter = (apply: () => void) => {
    apply()
    setSelected(new Set())
  }

  const clearFilters = () =>
    filter(() => {
      setSearch('')
      setStatusFilter('')
    })

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setReports(DEMO_REPORTS)
    setSelected(new Set())
  }

  const open = reports.find((r) => r.id === openId)
  if (open) {
    return (
      <DemoReportCard
        report={open}
        onBack={() => setOpenId(null)}
        onReview={(to) => review([open.id], to)}
      />
    )
  }

  return (
    <div className="demo-reports">
      <div className="demo-page-head">
        <div>
          <h3>Отчёты</h3>
          <span className="demo-page-sub">Сегодня · {plural(reports.length, REPORT_FORMS)}</span>
        </div>
        {changed && (
          <Button variant="ghost" className="demo-reset" onClick={reset}>
            <RotateCcw className="icon" />
            Сбросить
          </Button>
        )}
      </div>

      <div className="filters demo-filters">
        <SearchInput
          span={2}
          value={search}
          onChange={(value) => filter(() => setSearch(value))}
          placeholder="Номер машины"
        />
        <div className="span-2">
          <Select
            filter
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => filter(() => setStatusFilter(value))}
          />
        </div>
      </div>

      {/* Панель как в системе (ReviewBar); пока ничего не выбрано – подсказка на её месте */}
      {chosen.length ? (
        <div
          className="selection-bar demo-selection"
          role="region"
          aria-label="Действия с выбранными отчётами"
        >
          <span className="selection-count">Выбрано: {chosen.length}</span>
          <button type="button" className="reset" onClick={() => setSelected(new Set())}>
            Снять выделение
          </button>
          <div className="selection-actions">
            {actions.map(({ to, icon: Icon, label, count }) => (
              <Button key={to} variant="soft" disabled={!count} onClick={() => reviewChosen(to)}>
                <Icon className="icon" />
                {label} ({count})
              </Button>
            ))}
            <Button
              variant="danger-soft"
              disabled={!toReject}
              onClick={() => reviewChosen('rejected')}
            >
              <CircleX className="icon" />
              Отклонить ({toReject})
            </Button>
          </div>
        </div>
      ) : (
        <div className="demo-selection-hint">
          Отметьте отчёты галочками, чтобы принять или отклонить их, или откройте отчёт
        </div>
      )}

      <div className="demo-table" role="table" aria-label="Отчёты (демонстрация)">
        <div className="demo-row demo-row-head" role="row">
          <span role="columnheader">
            <input
              type="checkbox"
              className="row-check"
              aria-label="Выбрать все"
              checked={selected.size > 0 && selected.size === reviewable.length}
              disabled={!reviewable.length}
              onChange={toggleAll}
            />
          </span>
          <span role="columnheader" className="demo-col-time">
            Время
          </span>
          <span role="columnheader">Госномер</span>
          <span role="columnheader" className="demo-col-waste">
            Вид отходов
          </span>
          <span role="columnheader" className="demo-col-carrier">
            Перевозчик
          </span>
          <span role="columnheader" className="demo-col-num">
            Вес отходов
          </span>
          <span role="columnheader" className="demo-status-head">
            Статус
          </span>
        </div>
        {visible.map((r) => (
          // Строка открывает отчёт: кнопка на номере растянута на всю строку, чекбокс лежит поверх
          <div key={r.id} className={cx('demo-row', selected.has(r.id) && 'selected')} role="row">
            <label role="cell" className="demo-check">
              <input
                type="checkbox"
                className="row-check"
                aria-label={`Выбрать отчёт ${r.plate} ${r.region}`}
                checked={selected.has(r.id)}
                disabled={!isReviewable(r.status)}
                onChange={() => toggle(r.id)}
              />
            </label>
            <span role="cell" className="demo-col-time">
              {r.time}
            </span>
            <span role="cell" className="demo-plate">
              <button
                type="button"
                className="demo-open"
                aria-label={`Открыть отчёт ${r.plate} ${r.region}`}
                onClick={() => setOpenId(r.id)}
              >
                <PlateNumber number={r.plate} region={r.region} />
              </button>
            </span>
            <span role="cell" className="demo-col-waste">
              {r.wasteType}
            </span>
            <span role="cell" className="demo-col-carrier">
              {r.carrier}
            </span>
            <span role="cell" className="demo-col-num">
              {formatKg(r.nettoKg)}
            </span>
            <span role="cell" className="demo-status" key={versions[r.id] ?? 0}>
              <ReportStatusBadge status={demoStatus(r.status)} />
            </span>
          </div>
        ))}
        {!visible.length && (
          <div className="demo-empty">
            Ничего не найдено
            <Button variant="ghost" className="demo-reset" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
