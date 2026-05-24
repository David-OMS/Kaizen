import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TREASURY_INCOME_STATUS_OPTIONS } from '@/constants/treasuryOptions'
import { useTreasuryIncome } from '@/hooks/useTreasuryIncome'
import { useUpdateTreasuryIncomeStatus } from '@/hooks/useTreasuryMutations'
import { formatCurrency, formatDate } from '@/utils/format'

export function IncomeList({ raidLookup }) {
  const incomeQuery = useTreasuryIncome()
  const updateStatus = useUpdateTreasuryIncomeStatus()

  if (incomeQuery.isLoading) {
    return <Skeleton className="h-40 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (incomeQuery.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8 py-4">
        <CardContent className="px-4 text-sm text-red-100">{incomeQuery.error.message}</CardContent>
      </Card>
    )
  }

  const income = incomeQuery.data
  if (!income.length) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">No income entries yet.</CardContent>
      </Card>
    )
  }

  const handleStatusChange = (entry, status) => {
    updateStatus.mutate({
      id: entry.id,
      previousStatus: entry.status,
      status,
      receivedDate: entry.received_date,
    })
  }

  return (
    <div className="space-y-3">
      {income.map((entry) => (
        <Card key={entry.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardHeader className="px-4 pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
                {formatCurrency(entry.amount)}
              </CardTitle>
              <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
                {entry.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 text-sm text-zinc-300">
            <p>Raid: {raidLookup[entry.client_id] ?? 'Unlinked'}</p>
            <p>Expected: {formatDate(entry.expected_date)}</p>
            <p>Received: {formatDate(entry.received_date)}</p>
            <p>Description: {entry.description || '-'}</p>
            <div className="space-y-1">
              <p className="text-[10px] tracking-[0.1em] text-[#7DD3FC] uppercase">Update Status</p>
              <select
                value={entry.status}
                onChange={(event) => handleStatusChange(entry, event.target.value)}
                className="h-9 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
              >
                {TREASURY_INCOME_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} className="bg-[#12161D]">
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}