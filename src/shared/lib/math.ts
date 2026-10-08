// Значение, зажатое в границы min–max включительно
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

// Копия множества, в котором значение переключено: было — убрано, не было — добавлено
export function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set)
  if (!next.delete(value)) next.add(value)
  return next
}
