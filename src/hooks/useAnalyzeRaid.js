import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { analyzeAndPersistRaid } from '@/services/aiAnalysisService'

export function useAnalyzeRaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, title, description, scopeHints, existingSnapshot }) =>
      analyzeAndPersistRaid(clientId, { title, description, scopeHints }, existingSnapshot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients })
    },
  })
}
