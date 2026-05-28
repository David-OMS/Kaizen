import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemProgressBar } from '@/components/profile/SystemProgressBar'
import { deriveSapienRankFromXp } from '@/utils/sapienRank'

export function SapienProfileCard({ profile }) {
  const xp = profile?.sapien_xp ?? 0
  const derived = deriveSapienRankFromXp(xp)
  const rankTitle = profile?.sapien_rank ?? derived.rank.title

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <p className="text-[10px] tracking-[0.16em] text-[#A855F7] uppercase">Sapien path</p>
        <CardTitle className="mt-1 text-xl font-black tracking-[0.1em] text-[#A855F7] uppercase italic">
          {rankTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="flex justify-between text-xs text-zinc-300">
          <span>Sapien XP</span>
          <span className="font-mono text-white">{xp.toLocaleString()}</span>
        </div>
        <SystemProgressBar value={derived.progressPct} />
        {derived.nextRank ? (
          <p className="text-xs text-zinc-400">
            {derived.xpToNext.toLocaleString()} XP to {derived.nextRank.title}
          </p>
        ) : (
          <p className="text-xs text-zinc-400">Peak form reached.</p>
        )}
      </CardContent>
    </Card>
  )
}
