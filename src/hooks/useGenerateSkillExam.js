import { useMutation } from '@tanstack/react-query'
import { generateSkillVerificationExam } from '@/services/skillVerificationService'

export function useGenerateSkillExam() {
  return useMutation({
    mutationFn: (arcId) => generateSkillVerificationExam(arcId),
  })
}
