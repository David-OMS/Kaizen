import { Card, CardContent } from '@/components/ui/card'

export function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-3">
      <CardContent className="space-y-2 px-3">
        <div className="flex items-center gap-2 text-[#A855F7]">
          <Icon className="size-4" strokeWidth={1.8} />
          <p className="text-[10px] tracking-[0.14em] uppercase">{label}</p>
        </div>
        <p className="font-mono text-lg tracking-tight text-white">{value}</p>
      </CardContent>
    </Card>
  )
}