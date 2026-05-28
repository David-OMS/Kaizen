import { Card, CardContent } from '@/components/ui/card'

export function SapienRewardsPanel({ rewards }) {
  if (!rewards?.length) return null

  return (
    <div>
      <p className="mb-2 text-[10px] tracking-[0.14em] text-[#A855F7] uppercase">Streak rewards</p>
      <div className="space-y-2">
        {rewards.map((row) => (
          <Card key={row.id} className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-2">
            <CardContent className="px-4 py-1">
              <p className="text-sm text-white">{row.display_title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-[#A855F7]">
                {row.milestone_days}d · +{row.xp_bonus} XP
                {row.sapien_habits?.title ? ` · ${row.sapien_habits.title}` : ''}
              </p>
              {row.display_tagline ? (
                <p className="mt-1 text-[11px] text-zinc-500">{row.display_tagline}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
