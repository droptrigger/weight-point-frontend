import { useState, type SyntheticEvent } from 'react'
import { useCan } from '@/features/auth/permissions'
import { LandfillField } from '@/features/landfills/LandfillField'
import { plateLabel } from '@/features/vehicles/api'
import { useVehicleOptions } from '@/features/vehicles/hooks'
import { useWasteTypeOptions } from '@/features/waste-types/hooks'
import { fromDateTimeLocal, toDateTimeLocal } from '@/shared/lib/dates'
import type { LocalErrors } from '@/shared/lib/fieldError'
import { formatNumberInput, numberInputText } from '@/shared/lib/numberInput'
import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { useForm } from '@/shared/lib/useForm'
import { DateTimePicker } from '@/shared/ui/DateTimePicker'
import { FileField } from '@/shared/ui/FileField'
import { Field, FormActions, FormError, NumberField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import { Select } from '@/shared/ui/Select'
import type { PhotoTypeCode, ReportDetails } from './api'
import { useCreateReport, useUpdateReport } from './hooks'
import { PHOTO_ACCEPT } from './photos'

type Props = {
  open: boolean
  report?: ReportDetails // без отчёта — создание через веб
  onClose: () => void
  onCreated?: (report: ReportDetails) => void
}

type Form = {
  landfillId: string
  vehicleId: string
  wasteTypeId: string
  weightBruttoKg: string
  weightTaraKg: string
  bruttoAt: string // значение datetime-local
  taraAt: string
  createdAt: string // только при создании
}

// Ключи ошибок совпадают с полями запроса, в том числе для фото
type ErrorKey = keyof Form | `${PhotoTypeCode}Photo`

const PHOTO_FIELDS: { type: PhotoTypeCode; label: string }[] = [
  { type: 'vehicle', label: 'Фото машины' },
  { type: 'brutto', label: 'Фото весов: машина с грузом' },
  { type: 'tara', label: 'Фото весов: пустая машина' },
]

const initialForm = (r?: ReportDetails): Form => ({
  landfillId: r?.landfill.id ?? '',
  vehicleId: r?.vehicle.id ?? '',
  wasteTypeId: r?.wasteType?.id ?? '',
  weightBruttoKg: r?.weightBruttoKg == null ? '' : formatNumberInput(String(r.weightBruttoKg)),
  weightTaraKg: r?.weightTaraKg == null ? '' : formatNumberInput(String(r.weightTaraKg)),
  bruttoAt: toDateTimeLocal(r?.bruttoAt),
  taraAt: toDateTimeLocal(r?.taraAt),
  // Новый отчёт по умолчанию создан сейчас; дату можно сдвинуть назад, например для бумажного отчёта
  createdAt: r ? '' : toDateTimeLocal(new Date().toISOString()),
})

// Пусто — null; в поле пробелы между разрядами и запятая как десятичный разделитель
function parseKg(value: string): number | null | undefined {
  const text = numberInputText(value)
  if (!text) return null
  const kg = Number(text)
  return Number.isFinite(kg) && kg >= 0 ? kg : undefined // undefined — некорректный ввод
}

export function ReportFormModal({ open, report, onClose, onCreated }: Props) {
  return (
    <Modal
      open={open}
      title={report ? 'Редактирование отчёта' : 'Новый отчёт'}
      wide
      onClose={onClose}
    >
      <ReportForm report={report} onClose={onClose} onCreated={onCreated} />
    </Modal>
  )
}

function ReportForm({ report, onClose, onCreated }: Omit<Props, 'open'>) {
  const create = useCreateReport()
  const edit = useUpdateReport()
  const save = report ? edit : create
  const { form, set, update, error, clearError, validate } = useForm<Form, ErrorKey>(
    () => initialForm(report),
    save.error,
  )
  const [photos, setPhotos] = useState<Partial<Record<PhotoTypeCode, File>>>({})

  // Разработчик видит все полигоны: машины и виды отходов берутся из полигона отчёта, и он может
  // перенести отчёт в другой полигон. Остальным сервер сам отдаёт справочники их полигона
  const canAssign = useCan('landfills.assign') && Boolean(report)
  const scopeId = canAssign ? form.landfillId || undefined : undefined
  const vehicles = useVehicleOptions(scopeId, form.vehicleId || undefined)
  const wasteTypes = useWasteTypeOptions(scopeId, form.wasteTypeId || undefined)

  // В другом полигоне другие машины и виды отходов, поэтому прежний выбор сбрасывается
  const setLandfill = (landfillId: string) => update({ landfillId, vehicleId: '', wasteTypeId: '' })

  const setPhoto = (type: PhotoTypeCode) => (file: File | undefined) => {
    setPhotos((p) => ({ ...p, [type]: file }))
    clearError(`${type}Photo`)
  }

  // Машина или вид отходов отчёта могли стать неактивными и пропасть из списка: подпись из отчёта
  const sameLandfill = !canAssign || form.landfillId === report?.landfill.id
  const reportVehicle =
    report && sameLandfill && form.vehicleId === report.vehicle.id
      ? { value: report.vehicle.id, label: plateLabel(report.vehicle) }
      : undefined
  const reportWaste =
    report?.wasteType && sameLandfill && form.wasteTypeId === report.wasteType.id
      ? { value: report.wasteType.id, label: report.wasteType.name }
      : undefined

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const brutto = parseKg(form.weightBruttoKg)
    const tara = parseKg(form.weightTaraKg)

    const errors: LocalErrors<ErrorKey> = {}
    if (canAssign && !form.landfillId) errors.landfillId = 'Выберите полигон'
    if (!form.vehicleId) errors.vehicleId = 'Выберите машину'
    if (brutto === undefined) errors.weightBruttoKg = 'Неотрицательное число'
    if (tara === undefined) errors.weightTaraKg = 'Неотрицательное число'
    if (!report) {
      if (!form.createdAt) errors.createdAt = 'Укажите дату создания'
      for (const { type } of PHOTO_FIELDS) {
        if (!photos[type]) errors[`${type}Photo`] = 'Прикрепите фото'
      }
    }
    if (!validate(errors)) return

    const data = {
      vehicleId: form.vehicleId,
      wasteTypeId: form.wasteTypeId || null,
      weightBruttoKg: brutto ?? null,
      weightTaraKg: tara ?? null,
      bruttoAt: fromDateTimeLocal(form.bruttoAt),
      taraAt: fromDateTimeLocal(form.taraAt),
    }

    if (report) {
      edit.mutate(
        {
          id: report.id,
          data: {
            ...data,
            version: report.version,
            landfillId: canAssign ? form.landfillId : undefined,
          },
        },
        { onSuccess: onClose },
      )
    } else if (photos.vehicle && photos.brutto && photos.tara) {
      const files = { vehicle: photos.vehicle, brutto: photos.brutto, tara: photos.tara }
      const createdAt = fromDateTimeLocal(form.createdAt) ?? new Date().toISOString()
      create.mutate(
        { data: { ...data, createdAt }, photos: files },
        {
          onSuccess: (created) => {
            onClose()
            onCreated?.(created)
          },
        },
      )
    }
  }

  return (
    <form className="modal-form" onSubmit={submit} noValidate>
      {canAssign && (
        <LandfillField
          id="report-landfill"
          value={form.landfillId}
          onChange={setLandfill}
          error={error('landfillId')}
        />
      )}
      <Field id="report-vehicle" label="Машина" error={error('vehicleId')}>
        <Select
          id="report-vehicle"
          value={form.vehicleId}
          {...remoteSelectProps(vehicles, 'Выберите машину')}
          current={vehicles.current ?? reportVehicle}
          invalid={Boolean(error('vehicleId'))}
          onChange={set('vehicleId')}
        />
      </Field>
      <Field id="report-waste" label="Вид отходов" error={error('wasteTypeId')}>
        <Select
          id="report-waste"
          value={form.wasteTypeId}
          {...remoteSelectProps(wasteTypes, 'Не указан')}
          current={wasteTypes.current ?? reportWaste}
          invalid={Boolean(error('wasteTypeId'))}
          onChange={set('wasteTypeId')}
        />
      </Field>
      {!report && (
        <Field id="report-created-at" label="Дата создания отчёта" error={error('createdAt')}>
          <DateTimePicker
            id="report-created-at"
            value={form.createdAt}
            invalid={Boolean(error('createdAt'))}
            onChange={set('createdAt')}
          />
        </Field>
      )}
      <NumberField
        id="report-brutto"
        label="Вес машины с грузом, кг"
        half
        value={form.weightBruttoKg}
        onChange={set('weightBruttoKg')}
        error={error('weightBruttoKg')}
      />
      <Field
        id="report-brutto-at"
        label="Время взвешивания с грузом"
        half
        error={error('bruttoAt')}
      >
        <DateTimePicker
          id="report-brutto-at"
          value={form.bruttoAt}
          invalid={Boolean(error('bruttoAt'))}
          onChange={set('bruttoAt')}
        />
      </Field>
      <NumberField
        id="report-tara"
        label="Вес пустой машины, кг"
        half
        value={form.weightTaraKg}
        onChange={set('weightTaraKg')}
        error={error('weightTaraKg')}
      />
      <Field id="report-tara-at" label="Время взвешивания пустой" half error={error('taraAt')}>
        <DateTimePicker
          id="report-tara-at"
          value={form.taraAt}
          invalid={Boolean(error('taraAt'))}
          onChange={set('taraAt')}
        />
      </Field>
      {!report &&
        PHOTO_FIELDS.map(({ type, label }) => (
          <FileField
            key={type}
            id={`report-photo-${type}`}
            label={label}
            file={photos[type]}
            accept={PHOTO_ACCEPT}
            hint="JPG или PNG"
            error={error(`${type}Photo`)}
            onChange={setPhoto(type)}
          />
        ))}
      <FormError error={save.error} />
      <FormActions
        submitText={report ? 'Сохранить' : 'Создать отчёт'}
        pending={save.isPending}
        onCancel={onClose}
      />
    </form>
  )
}
