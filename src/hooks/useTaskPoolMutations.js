import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { createTaskPoolEntry, markTaskPoolTrackComplete, patchTaskPoolFocusSelection } from '@/services/taskPoolService'

export function useCreateTaskPoolEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTaskPoolEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
    },
  })
}

export function usePatchTaskPoolFocusSelection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: patchTaskPoolFocusSelection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
    },
  })
}

export function useMarkTaskPoolComplete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markTaskPoolTrackComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.weeklyQuests })
    },
  })
}