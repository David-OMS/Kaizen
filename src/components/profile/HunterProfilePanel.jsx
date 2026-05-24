import { AlertCircle, Flame, Target, Timer, Trophy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCapacityUsage } from '@/hooks/useCapacityUsage'
import { useProfile } from '@/hooks/useProfile'
import { useSkills } from '@/hooks/useSkills'
import { getCapacityPercentage } from '@/utils/capacity'
import { getDaysSinceFounding } from '@/utils/date'
import { deriveRankFromLevel, getProgressToNextLevel } from '@/utils/xpEngine'
import { RankBadge } from '@/components/profile/RankBadge'
import { SkillsGrid } from '@/components/profile/SkillsGrid'
import { StatCard } from '@/components/profile/StatCard'
import { HunterQuestSettingsCollapsible } from '@/components/profile/HunterQuestSettingsCollapsible'
import { useEnsureSkillCatalog } from '@/hooks/useEnsureSkillCatalog'
import { SystemProgressBar } from '@/components/profile/SystemProgressBar'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { DailyQuestBriefingModal } from '@/components/quest/DailyQuestBriefingModal'

export function HunterProfilePanel() {
  const [briefingOpen, setBriefingOpen] = useState(false)
  useEnsureSkillCatalog()
  const profileQuery = useProfile()
  const skillsQuery = useSkills()
  const capacityQuery = useCapacityUsage()

  if (profileQuery.isLoading || skillsQuery.isLoading || capacityQuery.isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-48 rounded-sm border border-[#1E2530] bg-[#12161D]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Skeleton className="h-24 rounded-sm border border-[#1E2530] bg-[#12161D]" />
          <Skeleton className="h-24 rounded-sm border border-[#1E2530] bg-[#12161D]" />
          <Skeleton className="h-24 rounded-sm border border-[#1E2530] bg-[#12161D]" />
          <Skeleton className="h-24 rounded-sm border border-[#1E2530] bg-[#12161D]" />
        </div>
      </section>
    )
  }

  if (profileQuery.isError || skillsQuery.isError || capacityQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
        <AlertCircle className="size-4" />
        <AlertTitle>System sync error</AlertTitle>
        <AlertDescription>
          {(profileQuery.error || skillsQuery.error || capacityQuery.error)?.message ??
            'Failed to load profile data.'}
        </AlertDescription>
      </Alert>
    )
  }

  const profile = profileQuery.data
  const skills = skillsQuery.data
  const activeCapacity = capacityQuery.data
  const xp = profile.xp ?? 0
  const level = profile.level ?? 1
  const derivedRank = deriveRankFromLevel(level)
  const rank = profile.rank ?? derivedRank.key
  const title = profile.title ?? derivedRank.title
  const xpProgress = getProgressToNextLevel(xp)
  const foundingDays = getDaysSinceFounding(profile.founding_date)
  const capacityTotal = profile.capacity_slots_total ?? 0
  const capacityPercent = getCapacityPercentage(activeCapacity, capacityTotal)

  return (
    <section className="space-y-4">
      <Card className="system-glitch rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardHeader className="px-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.16em] text-[#A855F7] uppercase">Hunter Profile</p>
              <CardTitle className="mt-1 text-xl font-black tracking-[0.1em] text-[#7DD3FC] uppercase italic">
                {profile.name}
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-300">{title}</p>
            </div>
            <RankBadge rank={`${rank} Rank`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm tracking-[0.08em] text-zinc-300 uppercase">Level</p>
            <p className="level-pulse font-mono text-xl font-semibold text-white">{level}</p>
          </div>
          <SystemProgressBar value={xpProgress.percentage} />
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
            <p>XP {xp.toLocaleString()}</p>
            <p>{xpProgress.remainingXp.toLocaleString()} to Level {level + 1}</p>
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        className="system-button w-full text-[10px]"
        onClick={() => setBriefingOpen(true)}
      >
        View today&apos;s directives
      </Button>
      <DailyQuestBriefingModal open={briefingOpen} onClose={() => setBriefingOpen(false)} />

      <HunterQuestSettingsCollapsible profile={profile} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Flame} label="Current Streak" value={`${profile.streak_current ?? 0} Days`} />
        <StatCard icon={Trophy} label="Best Streak" value={`${profile.streak_best ?? 0} Days`} />
        <StatCard icon={Timer} label="Since Founding" value={`${foundingDays} Days`} />
        <StatCard
          icon={Target}
          label="Capacity"
          value={`${activeCapacity}/${capacityTotal} (${capacityPercent}%)`}
        />
      </div>

      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardHeader className="px-4 pb-3">
          <CardTitle className="text-sm tracking-[0.16em] text-[#7DD3FC] uppercase italic">
            Skill Grid
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <SkillsGrid skills={skills} />
        </CardContent>
      </Card>
    </section>
  )
}