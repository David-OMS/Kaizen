import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getTreasuryExpenses } from '@/services/treasuryExpenseService'

export function useTreasuryExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.treasuryExpenses,
    queryFn: getTreasuryExpenses,
  })
}