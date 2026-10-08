type Props = { checked: boolean; onChange: (checked: boolean) => void }

// Отметка над списком справочника: включает в выдачу удалённые (неактивные) записи
export function InactiveToggle({ checked, onChange }: Props) {
  return (
    <label className="check-field inactive-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Показывать неактивные
    </label>
  )
}
