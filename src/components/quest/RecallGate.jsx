import { QuestCard } from '@/components/quest/QuestCard'
import { useRecallQuests } from '@/hooks/useQuests'

export function RecallGate({
  profile,
  onResolveQuest,
  onBattleIntel,
  onIncomplete,
  onAttemptFail,
  isResolving,
  isIncompletePending,
  isAttemptFailPending,
  isBattleIntelPending,
  incompleteError,
  attemptFailError,
  battleIntelError,
}) {
  const recallQuery = useRecallQuests()
  const quests = recallQuery.data ?? []

  if (!quests.length) return null

  return (
    <section className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#A855F7]">Recall Gate</p>
      <div className="space-y-3">
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            profile={profile}
            isResolving={isResolving}
            isIncompletePending={isIncompletePending}
            isAttemptFailPending={isAttemptFailPending}
            isBattleIntelPending={isBattleIntelPending}
            onComplete={() => onResolveQuest(quest, 'completed')}
            onBattleIntel={(intel) => onBattleIntel(quest, intel)}
            onIncomplete={(reason) => onIncomplete?.(quest, reason)}
            onAttemptFail={(reason) => onAttemptFail?.(quest, reason)}
            incompleteError={incompleteError}
            attemptFailError={attemptFailError}
            battleIntelError={battleIntelError}
          />
        ))}
      </div>
    </section>
  )
}
