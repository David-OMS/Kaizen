import { QUERY_KEYS } from '@/constants/queryKeys'

export function invalidateTreasuryLedger(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.treasuryLedger })
}
