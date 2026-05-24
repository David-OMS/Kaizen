import { useMutation } from '@tanstack/react-query'
import { signInWithPassword } from '@/services/authService'

export function useSignIn() {
  return useMutation({
    mutationFn: signInWithPassword,
  })
}