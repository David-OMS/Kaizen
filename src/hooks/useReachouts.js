import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getReachouts } from '@/services/reachoutService'

export function useReachouts() {
  return useQuery({
    queryKey: QUERY_KEYS.reachouts,
    queryFn: getReachouts,
  })
}