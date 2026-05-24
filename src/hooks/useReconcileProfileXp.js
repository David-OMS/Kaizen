import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { reconcileProfileXpFromLog } from '@/services/progressionService'

export function useReconcileProfileXp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reconcileProfileXpFromLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.xpLog })
    },
  })
}
