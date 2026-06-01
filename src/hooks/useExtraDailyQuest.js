import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { requestExtraDailyQuest } from '@/services/extraDailyQuestService'

export function useExtraDailyQuest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile) => requestExtraDailyQuest(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
    },
  })
}
