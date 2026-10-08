import { useState, type ChangeEvent, type SyntheticEvent } from 'react'
import { useCan } from '@/features/auth/permissions'
import { CarrierFormModal } from '@/features/carriers/CarrierFormModal'
import { useCarrierOptions } from '@/features/carriers/hooks'
import { LandfillField } from '@/features/landfills/LandfillField'
import { useMakeOptions } from '@/features/vehicle-makes/hooks'
import { MakeFormModal } from '@/features/vehicle-makes/MakeFormModal'
import { cx } from '@/shared/lib/cx'
import type { LocalErrors } from '@/shared/lib/fieldError'
import type { Option } from '@/shared/lib/options'
import { remoteSelectProps } from '@/shared/lib/remoteOptions'
import { useDisclosure } from '@/shared/lib/useDisclosure'
import { useForm } from '@/shared/lib/useForm'
import { Field, FormActions, FormError, TextField } from '@/shared/ui/Form'
import { Modal } from '@/shared/ui/Modal'
import { Select } from '@/shared/ui/Select'
import type { VehicleDetails } from './api'
import { useSaveVehicle } from './hooks'
import { PLATE_LENGTH, REGION_LENGTH, sanitizePlate } from './plate'

type Props = { open: boolean; vehicle?: VehicleDetails; onClose: () => void }
type Form = {
  plateNumber: string
  regionCode: string
  makeId: string
  carrierId: string
  landfillId: string
}

const initialForm = (vehicle?: VehicleDetails): Form => ({
  plateNumber: vehicle?.plateNumber ?? '',
  regionCode: vehicle?.regionCode ?? '',
  makeId: vehicle?.make?.id ?? '',
  carrierId: vehicle?.carrier?.id ?? '',
  landfillId: vehicle?.landfill?.id ?? '',
})

const NO_LANDFILL: Option[] = [{ value: '', label: 'Сначала выберите полигон' }]

export function VehicleFormModal({ open, vehicle, onClose }: Props) {
  return (
    <Modal open={open} title={vehicle ? 'Редактирование машины' : 'Новая машина'} onClose={onClose}>
      <VehicleForm vehicle={vehicle} onClose={onClose} />
    </Modal>
  )
}

function VehicleForm({ vehicle, onClose }: Omit<Props, 'open'>) {
  const save = useSaveVehicle()
  const { form, set, update, error, validate } = useForm(() => initialForm(vehicle), save.error)
  const addMake = useDisclosure()
  const addCarrier = useDisclosure()
  // Подписи выбранных марки и перевозчика, если их нет на загруженных страницах списка:
  // марка и перевозчик машины при редактировании, только что добавленные из формы
  const [known, setKnown] = useState<Option[]>(() =>
    [vehicle?.make, vehicle?.carrier].flatMap((x) => (x ? [{ value: x.id, label: x.name }] : [])),
  )
  const knownOption = (value: string) => known.find((o) => o.value === value)

  // Марки и перевозчики берутся из справочника полигона машины. Разработчик видит все полигоны,
  // поэтому списки фильтруются по полигону явно; остальным сервер и так отдаёт их полигон
  const canAssign = useCan('landfills.assign')
  const chooseLandfill = canAssign && !vehicle // полигон выбирается только при создании
  const scopeId = canAssign ? form.landfillId || undefined : undefined
  const listsReady = !canAssign || Boolean(scopeId)
  const makes = useMakeOptions(scopeId, form.makeId || undefined, listsReady)
  const carriers = useCarrierOptions(scopeId, form.carrierId || undefined, listsReady)

  // У другого полигона другие марки и перевозчики, поэтому прежний выбор сбрасывается
  const setLandfill = (landfillId: string) => update({ landfillId, makeId: '', carrierId: '' })

  const submit = (e: SyntheticEvent) => {
    e.preventDefault()
    const plateNumber = sanitizePlate(form.plateNumber)
    const regionCode = form.regionCode.trim()
    const errors: LocalErrors<keyof Form> = {}
    if (chooseLandfill && !form.landfillId) errors.landfillId = 'Выберите полигон'
    if (!plateNumber) errors.plateNumber = 'Заполните поле'
    if (!/^\d{2,3}$/.test(regionCode)) errors.regionCode = 'Две или три цифры'
    if (!form.makeId) errors.makeId = 'Выберите марку'
    if (!form.carrierId) errors.carrierId = 'Выберите перевозчика'
    if (!validate(errors)) return

    const data = {
      plateNumber,
      regionCode,
      makeId: form.makeId,
      carrierId: form.carrierId,
      landfillId: chooseLandfill ? form.landfillId : undefined,
    }
    save.mutate({ id: vehicle?.id, data }, { onSuccess: onClose })
  }

  return (
    <>
      <form className="modal-form" onSubmit={submit} noValidate>
        {chooseLandfill && (
          <LandfillField
            id="vehicle-landfill"
            value={form.landfillId}
            onChange={setLandfill}
            error={error('landfillId')}
          />
        )}
        <PlateField
          value={form.plateNumber}
          onChange={set('plateNumber')}
          error={error('plateNumber')}
        />
        <TextField
          id="vehicle-region"
          label="Регион"
          half
          inputMode="numeric"
          placeholder="35"
          maxLength={REGION_LENGTH}
          value={form.regionCode}
          onChange={(value) => set('regionCode')(value.replace(/\D/g, '').slice(0, REGION_LENGTH))}
          error={error('regionCode')}
        />
        <Field id="vehicle-make" label="Марка" error={error('makeId')}>
          <Select
            id="vehicle-make"
            value={form.makeId}
            {...(listsReady
              ? remoteSelectProps(makes, 'Выберите марку')
              : { options: NO_LANDFILL })}
            current={makes.current ?? knownOption(form.makeId)}
            invalid={Boolean(error('makeId'))}
            onChange={set('makeId')}
            addLabel={listsReady ? 'Добавить марку' : undefined}
            onAdd={listsReady ? addMake.show : undefined}
          />
        </Field>
        <Field id="vehicle-carrier" label="Перевозчик" error={error('carrierId')}>
          <Select
            id="vehicle-carrier"
            value={form.carrierId}
            {...(listsReady
              ? remoteSelectProps(carriers, 'Выберите перевозчика')
              : { options: NO_LANDFILL })}
            current={carriers.current ?? knownOption(form.carrierId)}
            invalid={Boolean(error('carrierId'))}
            onChange={set('carrierId')}
            addLabel={listsReady ? 'Добавить перевозчика' : undefined}
            onAdd={listsReady ? addCarrier.show : undefined}
          />
        </Field>
        <FormError error={save.error} />
        <FormActions
          submitText={vehicle ? 'Сохранить' : 'Добавить'}
          pending={save.isPending}
          onCancel={onClose}
        />
      </form>

      {/* Вне <form>: вложенные формы недопустимы */}
      <MakeFormModal
        open={addMake.open}
        landfillId={scopeId}
        onClose={addMake.hide}
        onCreated={(make) => {
          setKnown((k) => [...k, { value: make.id, label: make.name }])
          set('makeId')(make.id)
        }}
      />
      <CarrierFormModal
        open={addCarrier.open}
        landfillId={scopeId}
        onClose={addCarrier.hide}
        onCreated={(carrier) => {
          setKnown((k) => [...k, { value: carrier.id, label: carrier.name }])
          set('carrierId')(carrier.id)
        }}
      />
    </>
  )
}

type PlateFieldProps = { value: string; onChange: (value: string) => void; error?: string }

// Номер: только допустимые кириллические буквы и цифры, латиница заменяется на лету, не длиннее 6
function PlateField({ value, onChange, error }: PlateFieldProps) {
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const caret = input.selectionStart ?? input.value.length
    const plate = sanitizePlate(input.value).slice(0, PLATE_LENGTH)
    // Для того чтобы React не сбросил курсор в конец, значение в DOM обновляется сразу
    const pos = Math.min(sanitizePlate(input.value.slice(0, caret)).length, PLATE_LENGTH)
    input.value = plate
    input.setSelectionRange(pos, pos)
    onChange(plate)
  }

  return (
    <Field id="vehicle-plate" label="Номер" error={error} half>
      <input
        id="vehicle-plate"
        className={cx('input', error && 'invalid')}
        autoComplete="off"
        autoFocus
        placeholder="А123ВС"
        value={value}
        onChange={change}
      />
    </Field>
  )
}
