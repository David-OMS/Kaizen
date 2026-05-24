import { useAuthContext } from '@/context/useAuthContext'

export function useAuthSession() {
  return useAuthContext()
}