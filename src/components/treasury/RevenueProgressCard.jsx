import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemProgressBar } from '@/components/profile/SystemProgressBar'
import { formatCurrency } from '@/utils/format'

export function RevenueProgressCard({ summary }) {
  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm tracking-[0.14em] text-[#7DD3FC] uppercase italic">
          Monthly target
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 text-sm text-zinc-300">
        <SystemProgressBar value={summary.revenueProgress} />
        <p>
          {formatCurrency(summary.receivedThisMonth)} / {formatCurrency(summary.revenueTarget || 0)}
        </p>
      </CardContent>
    </Card>
  )
}
