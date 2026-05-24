import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'
import { QuestCard } from '@/components/quest/QuestCard'
import { useProfile } from '@/hooks/useProfile'
import { useDailyQuests } from '@/hooks/useQuests'
import { useResolveQuest, useSubmitQuestIncomplete } from '@/hooks/useQuestLifecycleMutations'
import { QUEST_STATUS } from '@/constants/questLifecycle'

export function DailyQuestBriefingModal({ open, onClose }) {
  const profileQuery = useProfile()
  const dailyQuery = useDailyQuests()
  const resolveQuest = useResolveQuest()
  const incomplete = useSubmitQuestIncomplete()

  const profile = profileQuery.data
  const quests = (dailyQuery.data ?? []).filter((q) =>
    [
      QUEST_STATUS.ACTIVE,
      QUEST_STATUS.EXTENDED,
      QUEST_STATUS.INCOMPLETE,
      QUEST_STATUS.ASSESSMENT_PENDING,
    ].includes(q.status),
  )
  const busy = resolveQuest.isPending || incomplete.isPending

  return (
    <ModalPanel open={open} title="Daily quests are ready" onClose={onClose} className="max-h-[85vh] overflow-y-auto">
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="font-mono text-xs text-[#7DD3FC]">
          Streak {profile?.streak_current ?? 0}d · Best {profile?.streak_best ?? 0}d
        </p>

        {dailyQuery.isLoading ? <p className="text-xs text-zinc-500">Loading directives…</p> : null}
        {dailyQuery.isError ? (
          <p className="text-xs text-red-300">{dailyQuery.error.message}</p>
        ) : null}

        {!quests.length && !dailyQuery.isLoading ? (
          <p className="text-xs text-zinc-500">No quests available rn.</p>
        ) : (
          <div className="space-y-2">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                profile={profile}
                isResolving={resolveQuest.isPending}
                isIncompletePending={incomplete.isPending}
                incompleteError={incomplete.error?.message}
                onComplete={() =>
                  profile && resolveQuest.mutateAsync({ quest, status: 'completed', profile })
                }
                onFail={() => profile && resolveQuest.mutateAsync({ quest, status: 'failed', profile })}
                onIncomplete={(reason) =>
                  profile && incomplete.mutateAsync({ quest, reason, profile })
                }
              />
            ))}
          </div>
        )}

        <Button type="button" className="system-button w-full text-[10px]" onClick={onClose}>
          Dismiss
        </Button>
      </div>
    </ModalPanel>
  )
}
