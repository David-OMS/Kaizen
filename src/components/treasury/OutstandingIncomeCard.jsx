import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'

export function OutstandingIncomeCard({ summary }) {
  const { outstandingCount, outstandingTributeTotal, outstandingBattleCount } = summary

  return (
    <Card className="rounded-sm border border-[#FF4B4B]/40 bg-[#FF4B4B]/8 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm tracking-[0.14em] text-red-100 uppercase italic">
          Outstanding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-4 text-sm text-red-50">
        {!outstandingCount ? (
          <p className="text-zinc-400">Clear</p>
        ) : (
          <>
            {outstandingBattleCount > 0 ? (
              <p>
                {outstandingBattleCount} battle{outstandingBattleCount === 1 ? '' : 's'} awaiting spoil
              </p>
            ) : null}
            {outstandingTributeTotal > 0 ? (
              <p>{formatCurrency(outstandingTributeTotal)} tribute ready to claim</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
