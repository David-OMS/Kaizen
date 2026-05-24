import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { runDailyProvision } from '@/services/questProvisionService'

function invalidateAll(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.weeklyQuests })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.questLog })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
}

export function useQuestProvision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (opts) => runDailyProvision(opts),
    onSuccess: () => invalidateAll(queryClient),
  })
}
