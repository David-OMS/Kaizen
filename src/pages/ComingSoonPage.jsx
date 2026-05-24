import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ComingSoonPage({ label }) {
  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm tracking-[0.16em] text-[#7DD3FC] uppercase italic">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-sm text-zinc-300">
          This phase module is reserved. Phase 1 currently focuses on the profile system.
        </p>
      </CardContent>
    </Card>
  )
}