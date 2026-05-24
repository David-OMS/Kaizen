import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skull } from 'lucide-react'

export function RejectionTrophyCard({ count }) {
  return (
    <Card className="rounded-sm border border-[#A855F7] bg-[#A855F7]/8 py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm tracking-[0.14em] text-[#7DD3FC] uppercase italic">
          <Skull className="size-4" strokeWidth={1.8} />
          Rejection Trophy
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="font-mono text-3xl text-white">{count}</p>
        <p className="mt-1 text-xs text-zinc-300">Each rejection grants XP and builds resilience.</p>
      </CardContent>
    </Card>
  )
}