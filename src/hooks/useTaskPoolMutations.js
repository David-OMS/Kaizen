import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { createTaskPoolEntry } from '@/services/taskPoolService'

export function useCreateTaskPoolEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTaskPoolEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
    },
  })
}