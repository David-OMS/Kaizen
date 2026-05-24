import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getActiveClientCount } from '@/services/clientService'

export function useCapacityUsage() {
  return useQuery({
    queryKey: QUERY_KEYS.activeCapacity,
    queryFn: getActiveClientCount,
  })
}