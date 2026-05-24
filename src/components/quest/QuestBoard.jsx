import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_STATUS } from '@/constants/questLifecycle'
import { useDailyQuests, useWeeklyQuests } from '@/hooks/useQuests'
import { useProfile } from '@/hooks/useProfile'
import { QuestCard } from '@/components/quest/QuestCard'

export function QuestBoard({
  period,
  onResolveQuest,
  onIncomplete,
  isResolving,
  isIncompletePending,
}) {
  const profileQuery = useProfile()
  const questsQuery = period === QUEST_PERIODS.DAILY ? useDailyQuests() : useWeeklyQuests()

  if (questsQuery.isLoading) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Loading {period} quests...</CardContent>
      </Card>
    )
  }

  if (questsQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
        <AlertTitle>Failed to load quests</AlertTitle>
        <AlertDescription>{questsQuery.error.message}</AlertDescription>
      </Alert>
    )
  }

  const quests = (questsQuery.data ?? []).filter((q) =>
    [
      QUEST_STATUS.ACTIVE,
      QUEST_STATUS.EXTENDED,
      QUEST_STATUS.ASSESSMENT_PENDING,
    ].includes(q.status),
  )

  return (
    <section className="space-y-4">
      {!quests.length ? (
        <p className="text-sm text-zinc-500">No quests available rn.</p>
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              profile={profileQuery.data}
              isResolving={isResolving}
              isIncompletePending={isIncompletePending}
              onComplete={() => onResolveQuest(quest, 'completed')}
              onFail={() => onResolveQuest(quest, 'failed')}
              onIncomplete={(reason) => onIncomplete?.(quest, reason)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
