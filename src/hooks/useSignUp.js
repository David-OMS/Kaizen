import { useMutation } from '@tanstack/react-query'
import { signUpWithUsername } from '@/services/authService'

export function useSignUp() {
  return useMutation({
    mutationFn: signUpWithUsername,
  })
}