// Номер без региона: буква, три цифры, две буквы (А123ВС). Регион — две или три цифры
export const PLATE_LENGTH = 6
export const REGION_LENGTH = 3

// В госномерах используются только 12 кириллических букв, совпадающих по виду с латиницей
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: 'А',
  B: 'В',
  E: 'Е',
  K: 'К',
  M: 'М',
  H: 'Н',
  O: 'О',
  P: 'Р',
  C: 'С',
  T: 'Т',
  Y: 'У',
  X: 'Х',
}

// Латинские двойники заменяются на кириллицу (ввод в английской раскладке),
// всё кроме допустимых букв и цифр отбрасывается
export const sanitizePlate = (v: string) =>
  v
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => LATIN_TO_CYRILLIC[c] ?? '')
    .replace(/[^АВЕКМНОРСТУХ0-9]/g, '')
