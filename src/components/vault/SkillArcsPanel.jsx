import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillArcCard } from '@/components/vault/SkillArcCard'
import { SkillArcProposeForm } from '@/components/vault/SkillArcProposeForm'
import { useDailyQuests, useWeeklyQuests } from '@/hooks/useQuests'
import { useSkillArcs } from '@/hooks/useSkillArcs'

export function SkillArcsPanel() {
  const arcsQuery = useSkillArcs()
  const dailyQuery = useDailyQuests()
  const weeklyQuery = useWeeklyQuests()

  const activeDaily = (dailyQuery.data ?? []).filter((q) => q.status === 'active')
  const activeWeekly = (weeklyQuery.data ?? []).filter((q) => q.status === 'active')

  if (arcsQuery.isLoading || dailyQuery.isLoading || weeklyQuery.isLoading) {
    return <Skeleton className="h-32 rounded-sm border border-[#1E2530] bg-[#12161D]" />
  }

  if (arcsQuery.isError) {
    return (
      <p className="rounded-sm border border-[#FF4B4B]/40 bg-[#FF4B4B]/10 px-3 py-2 text-sm text-red-200">
        {arcsQuery.error.message}
      </p>
    )
  }

  const arcs = arcsQuery.data ?? []

  return (
    <section className="space-y-3">
      <p className="text-xs text-zinc-400">
        Catalog skills unlock through XP and arcs. One arc may occupy accepted / active /
        verification at a time.
      </p>

      <SkillArcProposeForm />

      {!arcs.length ? (
        <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardContent className="px-4 text-sm text-zinc-400">No arcs yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {arcs.map((arc) => (
            <SkillArcCard
              key={arc.id}
              arc={arc}
              weeklyQuests={activeWeekly}
              dailyQuests={activeDaily}
            />
          ))}
        </div>
      )}
    </section>
  )
}
