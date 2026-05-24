import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getYesterdayDailyCompletionStatus } from '@/services/questService'
import { updateProfileStreak } from '@/services/profileService'

export { useResolveQuest, useSubmitQuestIncomplete, useQuestAssessment, useStartQuest } from '@/hooks/useQuestLifecycleMutations'

export function useSyncStreakOnLoad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profile) => {
      const completedYesterday = await getYesterdayDailyCompletionStatus()
      if (completedYesterday) return
      if (Number(profile.streak_current || 0) === 0) return

      await updateProfileStreak({
        streakCurrent: 0,
        streakBest: Number(profile.streak_best || 0),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
  })
}
