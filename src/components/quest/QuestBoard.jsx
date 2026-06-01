import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_STATUS } from '@/constants/questLifecycle'
import { useDailyQuests, useWeeklyQuests } from '@/hooks/useQuests'
import { useProfile } from '@/hooks/useProfile'
import { useTaskPool } from '@/hooks/useTaskPool'
import { isTaskPoolFullyComplete } from '@/utils/taskPoolComplete'
import { QuestCard } from '@/components/quest/QuestCard'
import { duplicatePoolMetaForQuests } from '@/utils/questDedupe'

export function QuestBoard({
  period,
  onResolveQuest,
  onBattleIntel,
  onIncomplete,
  onAttemptFail,
  onVoidDuplicate,
  onDismissDuplicate,
  isVoidDuplicatePending,
  isDismissDuplicatePending,
  voidDuplicateError,
  dismissDuplicateError,
  isBattleIntelPending,
  battleIntelError,
  isResolving,
  isIncompletePending,
  isAttemptFailPending,
  incompleteError,
  attemptFailError,
}) {
  const profileQuery = useProfile()
  const poolQuery = useTaskPool()
  const questsQuery = period === QUEST_PERIODS.DAILY ? useDailyQuests() : useWeeklyQuests()
  const poolById = Object.fromEntries((poolQuery.data ?? []).map((task) => [task.id, task]))

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

  const openQuests = (questsQuery.data ?? []).filter((q) =>
    [QUEST_STATUS.ACTIVE, QUEST_STATUS.EXTENDED, QUEST_STATUS.ASSESSMENT_PENDING].includes(q.status),
  )
  const doneQuests = (questsQuery.data ?? []).filter((q) => q.status === QUEST_STATUS.COMPLETED)
  const quests = [...openQuests, ...doneQuests]
  const { duplicateIds } = duplicatePoolMetaForQuests(quests)

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
              poolAlreadyComplete={
                quest.task_pool_id ? isTaskPoolFullyComplete(poolById[quest.task_pool_id]) : false
              }
              isDuplicateCopy={duplicateIds.has(quest.id)}
              isResolving={isResolving}
              isVoidDuplicatePending={isVoidDuplicatePending}
              isDismissDuplicatePending={isDismissDuplicatePending}
              voidDuplicateError={voidDuplicateError}
              dismissDuplicateError={dismissDuplicateError}
              onVoidDuplicate={() => onVoidDuplicate?.(quest)}
              onDismissDuplicate={() => onDismissDuplicate?.(quest)}
              isIncompletePending={isIncompletePending}
              onComplete={() => onResolveQuest(quest, 'completed')}
              onBattleIntel={(intel) => onBattleIntel?.(quest, intel)}
              onAttemptFail={(reason) => onAttemptFail?.(quest, reason)}
              onIncomplete={(reason) => onIncomplete?.(quest, reason)}
              isAttemptFailPending={isAttemptFailPending}
              isBattleIntelPending={isBattleIntelPending}
              attemptFailError={attemptFailError}
              battleIntelError={battleIntelError}
              incompleteError={incompleteError}
            />
          ))}
        </div>
      )}
    </section>
  )
}
