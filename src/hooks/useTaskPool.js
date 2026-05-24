import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getTaskPool } from '@/services/taskPoolService'

export function useTaskPool() {
  return useQuery({
    queryKey: QUERY_KEYS.taskPool,
    queryFn: getTaskPool,
  })
}