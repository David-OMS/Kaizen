import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getTreasuryIncome } from '@/services/treasuryIncomeService'

export function useTreasuryIncome() {
  return useQuery({
    queryKey: QUERY_KEYS.treasuryIncome,
    queryFn: getTreasuryIncome,
  })
}