import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { updateProfileQuestFields } from '@/services/questService'

export function useUpdateProfileQuestSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileQuestFields,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
  })
}
