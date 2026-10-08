// Классы элемента через пробел: ложные значения (условие не выполнено) пропускаются
export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ')
