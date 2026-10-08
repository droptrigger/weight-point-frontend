// Число в поле ввода: цифры с пробелами между разрядами (1 000), дробная часть через запятую
export function formatNumberInput(text: string) {
  const clean = text.replace(/[^\d.,]/g, '').replace('.', ',')
  const comma = clean.indexOf(',')
  const int = (comma < 0 ? clean : clean.slice(0, comma)).replace(/,/g, '')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (comma < 0) return grouped
  return `${grouped},${clean.slice(comma + 1).replace(/[.,]/g, '')}`
}

// Пробелы разрядов не мешают разбору
export const numberInputText = (value: string) => value.replace(/\s/g, '').replace(',', '.')

const significant = (char: string) => /[\d.,]/.test(char)

// Позиция курсора после форматирования: столько же значащих символов слева, сколько было
export function caretAfterFormat(raw: string, caret: number, formatted: string) {
  let count = 0
  for (let i = 0; i < caret; i++) if (significant(raw[i])) count++
  let pos = 0
  while (pos < formatted.length && count > 0) {
    if (significant(formatted[pos])) count--
    pos++
  }
  return pos
}
