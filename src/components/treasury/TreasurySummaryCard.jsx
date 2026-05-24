import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'

export function TreasurySummaryCard({ summary }) {
  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm tracking-[0.14em] text-[#7DD3FC] uppercase italic">
          Treasury
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 text-sm text-zinc-300">
        <p>
          <span className="text-zinc-500">Since founding </span>
          <span className="font-mono text-white">{formatCurrency(summary.receivedLifetime)}</span>
        </p>
        <p>
          <span className="text-zinc-500">This month </span>
          <span className="font-mono text-[#7DD3FC]">{formatCurrency(summary.receivedThisMonth)}</span>
        </p>
        <p>
          <span className="text-zinc-500">Expenses (month) </span>
          {formatCurrency(summary.expensesThisMonth)}
        </p>
        <p className="font-semibold text-white">Net (month) {formatCurrency(summary.netThisMonth)}</p>
      </CardContent>
    </Card>
  )
}
