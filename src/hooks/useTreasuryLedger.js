import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { fetchTreasuryLedger } from '@/services/treasuryLedgerService'

export function useTreasuryLedger() {
  return useQuery({
    queryKey: QUERY_KEYS.treasuryLedger,
    queryFn: fetchTreasuryLedger,
  })
}
