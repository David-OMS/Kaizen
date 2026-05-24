import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getXpLog } from '@/services/xpLogService'

export function useXpLog(eventTypeFilter) {
  return useQuery({
    queryKey: [...QUERY_KEYS.xpLog, eventTypeFilter ?? 'all'],
    queryFn: () => getXpLog(eventTypeFilter),
  })
}