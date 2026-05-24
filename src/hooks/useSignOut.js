import { useMutation } from '@tanstack/react-query'
import { signOut } from '@/services/authService'

export function useSignOut() {
  return useMutation({
    mutationFn: signOut,
  })
}