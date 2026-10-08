import { useQuery } from '@tanstack/react-query'
import { authApi } from './api'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

// Текущая учётная запись: имя в шапке и полигон под логотипом
export const useMe = () => useQuery({ queryKey: authKeys.me(), queryFn: authApi.me })
