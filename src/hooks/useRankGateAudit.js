import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { fetchRankGateAudit } from '@/services/rankGateAuditService'

export function useRankGateAudit() {
  return useQuery({
    queryKey: QUERY_KEYS.rankGateAudit,
    queryFn: fetchRankGateAudit,
    staleTime: 45_000,
  })
}
