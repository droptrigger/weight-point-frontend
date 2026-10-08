// Код по ФККО — 11 цифр, принято писать группами: 1 00 000 00 00 0
const GROUPS = [1, 2, 3, 2, 2, 1]
export const CODE_LENGTH = GROUPS.reduce((sum, n) => sum + n, 0)

export const codeDigits = (v: string) => v.replace(/\D/g, '').slice(0, CODE_LENGTH)

// Цифры раскладываются по группам; неполный код форматируется по мере ввода
export function formatCodeDigits(digits: string) {
  const parts: string[] = []
  let pos = 0
  for (const size of GROUPS) {
    if (pos >= digits.length) break
    parts.push(digits.slice(pos, pos + size))
    pos += size
  }
  return parts.join(' ')
}

// Для отображения: коды не из одних цифр (старые записи) остаются как есть
export const formatWasteCode = (code: string) =>
  /^\d+$/.test(code) && code.length <= CODE_LENGTH ? formatCodeDigits(code) : code
