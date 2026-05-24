import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getAchievements, manualAwardAchievement } from '@/services/achievementService'

export function useAchievements() {
  return useQuery({
    queryKey: QUERY_KEYS.achievements,
    queryFn: getAchievements,
  })
}

export function useManualAwardAchievement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: manualAwardAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.achievements })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.xpLog })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
  })
}