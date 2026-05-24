import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { analyzeAndPersistQuest } from '@/services/aiAnalysisService'

export function useAnalyzeQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ questId, title, context, existingSnapshot }) =>
      analyzeAndPersistQuest(questId, { title, context }, existingSnapshot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.weeklyQuests })
    },
  })
}
