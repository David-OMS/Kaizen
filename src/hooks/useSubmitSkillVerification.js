import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { gradeSkillExamAndFinalize } from '@/services/skillVerificationService'

export function useSubmitSkillVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ arcId, questions, answers }) => gradeSkillExamAndFinalize(arcId, { questions, answers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skillArcs })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills })
    },
  })
}
