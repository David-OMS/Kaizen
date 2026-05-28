import { useMemo, useState } from 'react'
import { ExpenseEntryForm } from '@/components/treasury/ExpenseEntryForm'
import { ExpenseList } from '@/components/treasury/ExpenseList'
import { OutstandingIncomeCard } from '@/components/treasury/OutstandingIncomeCard'
import { RevenueProgressCard } from '@/components/treasury/RevenueProgressCard'
import { TreasuryActions } from '@/components/treasury/TreasuryActions'
import { TreasuryOutstandingList } from '@/components/treasury/TreasuryOutstandingList'
import { TreasuryReceivedList } from '@/components/treasury/TreasuryReceivedList'
import { TreasurySectionTabs } from '@/components/treasury/TreasurySectionTabs'
import { TreasurySummaryCard } from '@/components/treasury/TreasurySummaryCard'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useProfile } from '@/hooks/useProfile'
import { useTreasuryLedger } from '@/hooks/useTreasuryLedger'
import { getTreasuryLedgerSummary } from '@/utils/treasuryLedger'

export function TreasuryDashboard() {
  const [activeSection, setActiveSection] = useState('received')
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

  const profileQuery = useProfile()
  const ledgerQuery = useTreasuryLedger()

  const summary = useMemo(() => {
    if (!ledgerQuery.data) return null
    return getTreasuryLedgerSummary({
      received: ledgerQuery.data.received,
      outstanding: ledgerQuery.data.outstanding,
      expenses: ledgerQuery.data.expenses,
      revenueTargetMonthly: profileQuery.data?.revenue_target_monthly ?? 0,
      collectionReceivedLifetime: ledgerQuery.data.collectionReceivedLifetime,
    })
  }, [ledgerQuery.data, profileQuery.data?.revenue_target_monthly])

  if (ledgerQuery.isLoading || profileQuery.isLoading) {
    return <Skeleton className="h-48 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (ledgerQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
        <AlertTitle>Treasury unavailable</AlertTitle>
        <AlertDescription>{ledgerQuery.error.message}</AlertDescription>
      </Alert>
    )
  }

  const { received, outstanding, expenses } = ledgerQuery.data

  return (
    <section className="space-y-4">
      <TreasuryActions onOpenExpenseModal={() => setIsExpenseModalOpen(true)} />

      <div className="grid gap-3 md:grid-cols-3">
        <TreasurySummaryCard summary={summary} />
        <RevenueProgressCard summary={summary} />
        <OutstandingIncomeCard summary={summary} />
      </div>

      <TreasurySectionTabs
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        outstandingCount={summary.outstandingCount}
      />

      {activeSection === 'received' ? <TreasuryReceivedList received={received} /> : null}
      {activeSection === 'outstanding' ? <TreasuryOutstandingList outstanding={outstanding} /> : null}
      {activeSection === 'expenses' ? <ExpenseList expenses={expenses} /> : null}

      <ModalPanel open={isExpenseModalOpen} title="Add expense" onClose={() => setIsExpenseModalOpen(false)}>
        <ExpenseEntryForm onSaved={() => setIsExpenseModalOpen(false)} />
      </ModalPanel>
    </section>
  )
}
