import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { syncDailyStreakOnLoad } from '@/services/profileService'

export { useResolveQuest, useSubmitQuestIncomplete, useQuestAssessment, useStartQuest } from '@/hooks/useQuestLifecycleMutations'

export function useSyncStreakOnLoad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncDailyStreakOnLoad,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
  })
}
