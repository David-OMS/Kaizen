import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RANK_GATES } from '@/constants/gamification'
import { useRankGateAudit } from '@/hooks/useRankGateAudit'
import { RANK_GATE_METRIC_LABELS } from '@/utils/rankGateLabels'

function formatUnmet(unmet) {
  if (!unmet?.length) return null
  return unmet.map((u) => `${RANK_GATE_METRIC_LABELS[u.metric] ?? u.metric}: need ${u.minimum}`).join(' · ')
}

export function RankPromotionAudit() {
  const audit = useRankGateAudit()

  if (audit.isLoading) {
    return <Skeleton className="h-28 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (audit.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B]/40 bg-[#12161D]/90 py-3">
        <CardContent className="px-4 pt-3 text-[10px] text-red-200">{audit.error.message}</CardContent>
      </Card>
    )
  }

  const d = audit.data
  if (!d) return null

  const gateDef = d.promotion ? RANK_GATES[d.promotion.targetRank] : null

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-3">
      <CardHeader className="px-4 pb-1">
        <CardTitle className="text-[11px] tracking-[0.14em] text-[#7DD3FC] uppercase italic">
          Rank gate audit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 text-[10px] leading-relaxed text-zinc-400">
        <p>
          Level {d.level} → rank from XP: <span className="text-zinc-200">{d.derivedRank}</span> · stored:{' '}
          <span className="text-zinc-200">{d.currentRank}</span>
        </p>
        <p>
          Raids {d.metrics.raidsSigned} · Hunts {d.metrics.huntsLogged} · Dungeons {d.metrics.dungeonsCompleted} ·
          Streak best {d.metrics.streakPeak}
        </p>
        {d.demotionWouldApply ? (
          <p className="text-[#A855F7]/90">
            Level implies a lower rank than stored. The next progression sync will demote to match level.
          </p>
        ) : null}
        {d.promotion ? (
          <div className="space-y-1 border-t border-[#1E2530] pt-2">
            <p className="text-zinc-300">
              Promotion target: <span className="text-[#A855F7]">{d.promotion.targetRank}</span> (
              {d.promotion.targetTitle})
            </p>
            {gateDef ? (
              <p className="text-zinc-500">
                Gates: {Object.entries(gateDef)
                  .map(([k, v]) => `${RANK_GATE_METRIC_LABELS[k] ?? k} ≥ ${v}`)
                  .join(' · ')}
              </p>
            ) : null}
            {d.promotion.gate.passed ? (
              <p className="text-emerald-300/90">All requirements met — promotion allowed on next XP sync.</p>
            ) : (
              <p className="text-[#A855F7]/90">Blocked: {formatUnmet(d.promotion.gate.unmet) ?? 'See metrics above.'}</p>
            )}
          </div>
        ) : !d.demotionWouldApply && d.derivedRank === d.currentRank ? (
          <p className="text-zinc-500">No pending promotion; stored rank matches level.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
