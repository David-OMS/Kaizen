import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { createTreasuryExpense } from '@/services/treasuryExpenseService'
import { createTreasuryIncome, updateTreasuryIncomeStatus } from '@/services/treasuryIncomeService'
import { runPostXpChecks } from '@/services/gamificationService'
import { addXP } from '@/services/xpService'
import { getInvoicePaidXp } from '@/utils/xpAwards'

function invalidateTreasuryQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.treasuryExpenses })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.treasuryLedger })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
}

export function useCreateTreasuryIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTreasuryIncome,
    onSuccess: () => {
      invalidateTreasuryQueries(queryClient)
    },
  })
}

export function useUpdateTreasuryIncomeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      const updated = await updateTreasuryIncomeStatus(payload)

      if (updated.status === 'received' && payload.previousStatus !== 'received') {
        await addXP(
          getInvoicePaidXp({ amount: updated.amount }),
          XP_EVENT_TYPES.INVOICE_PAID,
          `Invoice received: ${updated.amount}.`,
        )
      }

      return updated
    },
    onSuccess: () => {
      invalidateTreasuryQueries(queryClient)
    },
  })
}

export function useCreateTreasuryExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTreasuryExpense,
    onSuccess: async () => {
      invalidateTreasuryQueries(queryClient)
      await runPostXpChecks({ eventType: XP_EVENT_TYPES.TREASURY_EXPENSE_LOGGED })
    },
  })
}