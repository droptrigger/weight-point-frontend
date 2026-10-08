import { createContext, type ReactNode } from 'react'

// Блок учётной записи в правой части шапки. Для того чтобы shared не зависел от features,
// содержимое передаёт каркас приложения
export const HeaderAccountContext = createContext<ReactNode>(null)
