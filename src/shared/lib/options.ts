// note — пометка справа от подписи в выпадающем списке (например, «Лицензия истекла»)
export type Option = { value: string; label: string; note?: string }

type Named = { id: string | number; name: string }

// Первый пункт с пустым значением («Все …», «Не указан») плюс записи справочника
export const toOptions = (emptyLabel: string, items: readonly Named[] = []): Option[] => [
  { value: '', label: emptyLabel },
  ...items.map((item) => ({ value: String(item.id), label: item.name })),
]
