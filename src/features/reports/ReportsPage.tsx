import { Fragment, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, CloudOff } from 'lucide-react'
import { useCan, useOwnLandfillId } from '@/features/auth/permissions'
import { useLandfill } from '@/features/landfills/hooks'
import { LandfillAnalytics } from '@/features/landfills/LandfillAnalytics'
import { LandfillFilter } from '@/features/landfills/LandfillFilter'
import { useLandfillFilter } from '@/features/landfills/useLandfillFilter'
import { plateLabel } from '@/features/vehicles/api'
import { cx } from '@/shared/lib/cx'
import { endOfDayIso, startOfDayIso } from '@/shared/lib/dates'
import { formatKg, formatKgRounded, formatShort } from '@/shared/lib/format'
import { toggled } from '@/shared/lib/math'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useListParams } from '@/shared/lib/useListParams'
import { AddButton } from '@/shared/ui/AddButton'
import { PlateNumber } from '@/shared/ui/Badges'
import { DateRangePicker } from '@/shared/ui/DateRangePicker'
import { ListPage } from '@/shared/ui/ListPage'
import { SearchInput } from '@/shared/ui/SearchInput'
import { Select } from '@/shared/ui/Select'
import { StatCards } from '@/shared/ui/StatCards'
import { Tooltip } from '@/shared/ui/Tooltip'
import type { ReportParams, ReportStatusCode } from './api'
import { useReportAnalytics, useReports } from './hooks'
import { useLiveRows } from './live/useLiveRows'
import { ReportDrawer } from './ReportDrawer'
import { ReportFormModal } from './ReportFormModal'
import { ReportPreview } from './ReportPreview'
import { ReportSourceIcon } from './ReportSourceIcon'
import { ReportStatusBadge } from './ReportStatusBadge'
import { ReportsTabs } from './ReportsTabs'
import { ReviewBar } from './ReviewBar'
import { isReportStatus, isReviewable, STATUS_OPTIONS, statusLabel } from './statuses'
import { useReportSelection } from './useReportSelection'

// vehicleId приходит из ссылки «Отчёты по этой машине»
const FILTERS = ['landfillId', 'vehicleId', 'status', 'from', 'to'] as const
// В очереди проверки статус задан самим разделом
const REVIEW_FILTERS = ['landfillId', 'vehicleId', 'from', 'to'] as const

const COLUMNS = ['Время', 'Полигон', 'Номер', 'С грузом', 'Пустая', 'Вес отходов', 'Статус']

type ScopeProps = {
  canFilter: boolean // разработчик: аналитика по выбранному полигону или по всем
  selectedId?: string
}

// Без права на фильтр аналитика строится по своему полигону из токена
function useAnalyticsScope({ canFilter, selectedId }: ScopeProps) {
  const ownLandfillId = useOwnLandfillId()
  return canFilter ? selectedId : (ownLandfillId ?? undefined)
}

function ReportStats(props: ScopeProps) {
  const { data, isPending } = useReportAnalytics(useAnalyticsScope(props))

  return (
    <StatCards
      loading={isPending}
      stats={[
        { label: 'Всего отчётов', value: data?.totalReportsCount },
        { label: 'За сегодня', value: data?.todayReportsCount },
        { label: 'За месяц', value: data?.monthReportsCount },
        {
          label: 'Средний вес отходов за месяц',
          value: data && formatKgRounded(data.monthAverageNettoKg),
        },
      ]}
    />
  )
}

// Аналитика полигона (вес отходов всего и в среднем за всё время) — только для разработчика,
// выбравшего полигон в фильтре. Остальные видят её на странице своего полигона
function LandfillSummary(props: ScopeProps) {
  const landfillId = props.canFilter ? props.selectedId : undefined
  const landfill = useLandfill(landfillId ?? '', Boolean(landfillId))
  if (!landfillId) return null

  const name = landfill.data?.name
  return (
    <LandfillAnalytics
      landfillId={landfillId}
      title={name ? `Полигон «${name}»` : 'Выбранный полигон'}
    />
  )
}

// review — подраздел «На проверке»: только отчёты, ждущие проверки, без статистики и фильтра статуса
// Статус отчёта, который только что ушёл из списка: названия статуса в событии нет, только код
function GoneStatus({ status, deleted }: { status: ReportStatusCode | null; deleted: boolean }) {
  if (deleted || !status) return <span className="badge status-deleted">Удалён</span>
  return <ReportStatusBadge status={{ code: status, name: statusLabel(status) }} />
}

export function ReportsPage({ review = false }: { review?: boolean }) {
  const landfillFilter = useLandfillFilter(review ? REVIEW_FILTERS : FILTERS)
  const list = useListParams(landfillFilter.filterKeys)
  const { vehicleId, from, to } = list.filters
  const status = review ? 'awaiting_review' : list.filters.status
  const landfillId = landfillFilter.enabled ? list.filters.landfillId : undefined

  const scope: ScopeProps = {
    canFilter: landfillFilter.enabled,
    selectedId: landfillId || undefined,
  }

  const params: ReportParams = {
    page: list.page,
    pageSize: list.pageSize,
    search: list.search,
    landfillId,
    vehicleId,
    // Неизвестный код из URL не уходит на сервер, чтобы не получить ошибку валидации
    status: isReportStatus(status) ? status : undefined,
    from: from ? startOfDayIso(from) : undefined,
    to: to ? endOfDayIso(to) : undefined,
  }
  const query = useReports(params)
  const listKey = JSON.stringify(params)
  // Отчёт, который ушёл из списка с фильтром по статусу (например, его принял другой проверяющий),
  // ещё несколько секунд виден на месте с новым статусом
  const rows = useLiveRows(query.data?.items, listKey, {
    placeholder: query.isPlaceholderData,
    keepGone: Boolean(params.status),
  })

  // Проверяющие (контролер полигона, администрация организации, разработчик) выделяют отчёты для массовой смены статуса
  const canReview = useCan('reports.review')
  const selection = useReportSelection(query.data?.items, listKey)

  // Отчёт через веб создают оператор, контролер полигона и администрация организации — в своём полигоне
  const canCreate = useCan('reports.create')
  const create = useDisclosure()
  // Раскрытые строки: под ними фото отчёта, без перехода на его страницу
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const toggleExpanded = (id: string) => setExpanded((prev) => toggled(prev, id))
  // Полигон отчёта видит только разработчик, остальные работают в своём
  const canSeeLandfills = useCan('landfills.view')
  const columns = canSeeLandfills ? COLUMNS : COLUMNS.filter((c) => c !== 'Полигон')
  const tableClass = cx(
    'list-reports',
    canReview && 'list-reports--select',
    !canSeeLandfills && 'list-reports--own',
  )

  // Открытый в панели отчёт живёт в URL рядом с фильтрами: список под панелью не сбрасывается
  const [searchParams, setSearchParams] = useSearchParams()
  const reportId = searchParams.get('report')
  const reportSearch = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('report', id)
    else next.delete('report')
    return next
  }
  // Переход к соседнему отчёту и закрытие не копят историю: «Назад» в браузере уводит со списка
  const selectReport = (id: string | null) => setSearchParams(reportSearch(id), { replace: true })
  const reportIds = query.data?.items.map((r) => r.id) ?? []

  // Открытая строка остаётся в поле зрения при переходе стрелками
  useEffect(() => {
    if (reportId)
      document
        .querySelector(`[data-report-id="${CSS.escape(reportId)}"]`)
        ?.scrollIntoView({ block: 'nearest' })
  }, [reportId])

  const selectAll = (
    <input
      type="checkbox"
      className="row-check"
      aria-label="Выбрать все отчёты на странице"
      checked={selection.allSelected}
      ref={(el) => {
        if (el) el.indeterminate = selection.someSelected
      }}
      disabled={!selection.hasSelectable}
      onChange={selection.toggleAll}
    />
  )
  const headers = [...(canReview ? [selectAll] : []), '', ...columns]
  // Фото в раскрытой строке стоят под своими колонками: машина под номером, весы под весами
  const photoColumns = {
    vehicle: headers.indexOf('Номер') + 1,
    brutto: headers.indexOf('С грузом') + 1,
    tara: headers.indexOf('Пустая') + 1,
  }

  return (
    <>
      <ListPage
        title={review ? 'Отчёты на проверке' : 'Отчёты'}
        list={list}
        query={query}
        items={rows}
        actions={canCreate && <AddButton label="Добавить отчёт" onClick={create.show} />}
        columns={headers}
        tableClass={tableClass}
        above={canReview && <ReviewBar selection={selection} />}
        top={
          <>
            <ReportsTabs />
            {!review && (
              <>
                <ReportStats {...scope} />
                <LandfillSummary {...scope} />
              </>
            )}
          </>
        }
        filters={
          <>
            <SearchInput
              // Без фильтра статуса поиск занимает и его колонку
              span={landfillFilter.enabled ? (review ? 2 : 1) : review ? 3 : 2}
              value={list.search}
              onChange={list.setSearch}
              placeholder="Номер машины"
            />
            {landfillFilter.enabled && (
              <LandfillFilter
                value={landfillId ?? ''}
                onChange={(value) => list.setFilter('landfillId', value)}
              />
            )}
            {!review && (
              <Select
                filter
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) => list.setFilter('status', value)}
              />
            )}
            <DateRangePicker from={from} to={to} onChange={list.setFilters} />
          </>
        }
        renderRow={({ report, fresh, gone }) => (
          // Строка не ссылка целиком: внутри <a> нельзя класть чекбокс. Ссылка на номере растянута
          // на всю строку через ::after, чекбокс лежит поверх неё
          <Fragment key={report.id}>
            <div
              className={cx(
                'report-row row-linked',
                selection.isSelected(report.id) && 'selected',
                fresh && 'fresh',
                gone && 'gone',
                expanded.has(report.id) && 'expanded',
                report.id === reportId && 'active',
              )}
              data-report-id={report.id}
            >
              {canReview && (
                <span className="cell-check">
                  <input
                    type="checkbox"
                    className="row-check"
                    aria-label={`Выбрать отчёт ${plateLabel(report)}`}
                    checked={selection.isSelected(report.id)}
                    // Отправленный в ФГИС УТКО отчёт больше не меняется
                    disabled={Boolean(gone) || !isReviewable(report.status.code)}
                    onChange={() => selection.toggle(report.id)}
                  />
                </span>
              )}
              <span className="cell-expand">
                <button
                  type="button"
                  className="expand-toggle"
                  aria-expanded={expanded.has(report.id)}
                  aria-label={expanded.has(report.id) ? 'Скрыть фото' : 'Показать фото'}
                  title={expanded.has(report.id) ? 'Скрыть фото' : 'Показать фото'}
                  onClick={() => toggleExpanded(report.id)}
                >
                  <ChevronRight className="icon" />
                </button>
              </span>
              <div className="cell cell-time" data-label="Время">
                <ReportSourceIcon source={report.source} />
                {formatShort(report.createdAt)}
              </div>
              {canSeeLandfills && (
                <div className="cell cell-landfill" data-label="Полигон">
                  {report.landfillName}
                </div>
              )}
              <Link
                // Повторный клик по открытой строке закрывает панель
                to={{
                  search: reportSearch(report.id === reportId ? null : report.id).toString(),
                }}
                replace={report.id === reportId}
                className="row-link"
                aria-current={report.id === reportId || undefined}
              >
                <PlateNumber number={report.plateNumber} region={report.regionCode} />
              </Link>
              <div className="cell cell-num" data-label="С грузом">
                {formatKg(report.weightBruttoKg)}
              </div>
              <div className="cell cell-num" data-label="Пустая">
                {formatKg(report.weightTaraKg)}
              </div>
              <div className="cell cell-num" data-label="Вес отходов">
                {formatKg(report.weightNettoKg)}
              </div>
              <div className="cell cell-status" data-label="Статус">
                {gone ? (
                  <GoneStatus status={gone.status} deleted={gone.kind === 'deleted'} />
                ) : (
                  <ReportStatusBadge status={report.status} />
                )}
                {report.wasteType && !report.wasteType.requiresSending && (
                  <Tooltip
                    className="no-sending-mark"
                    content={
                      <>
                        <span className="tooltip-title">Не выгружается в ФГИС УТКО</span>
                        <span className="tooltip-text">
                          Вид отхода «{report.wasteType.name}» не отправляется
                        </span>
                      </>
                    }
                  >
                    <CloudOff className="icon" role="img" aria-label="Не выгружается в ФГИС УТКО" />
                  </Tooltip>
                )}
              </div>
            </div>
            {expanded.has(report.id) && <ReportPreview id={report.id} columns={photoColumns} />}
          </Fragment>
        )}
      />
      <ReportFormModal
        open={create.open}
        onClose={create.hide}
        onCreated={(report) => selectReport(report.id)}
      />
      {reportId && (
        <ReportDrawer
          id={reportId}
          ids={reportIds}
          onSelect={selectReport}
          onClose={() => selectReport(null)}
        />
      )}
    </>
  )
}
