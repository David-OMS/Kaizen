import { useEffect, useState } from 'react'
import { CipherDropBanner } from '@/components/quest/CipherDropBanner'
import { ExtraDailyQuestPanel } from '@/components/quest/ExtraDailyQuestPanel'
import { CuriosityBanner } from '@/components/quest/CuriosityBanner'
import { WeeklyQuotaPanel } from '@/components/quest/WeeklyQuotaPanel'
import { QuestBoard } from '@/components/quest/QuestBoard'
import { RecallGate } from '@/components/quest/RecallGate'
import { QuestLogList } from '@/components/quest/QuestLogList'
import { QuestSectionTabs } from '@/components/quest/QuestSectionTabs'
import { TaskPoolSection } from '@/components/quest/TaskPoolSection'
import { useClients } from '@/hooks/useClients'
import {
  useResolveQuest,
  useSubmitBattleIntel,
  useSubmitQuestAttemptFail,
  useSubmitQuestIncomplete,
  useDismissDuplicateDailyQuest,
  useVoidDuplicatePoolQuest,
} from '@/hooks/useQuestLifecycleMutations'
import { useAutoDailyProvision } from '@/hooks/useAutoDailyProvision'
import { useSyncStreakOnLoad } from '@/hooks/useQuestMutations'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'

export function QuestsDashboard() {
  const [activeSection, setActiveSection] = useState('task_pool')

  const profileQuery = useProfile()
  const raidsQuery = useClients()
  const resolveQuest = useResolveQuest()
  const incomplete = useSubmitQuestIncomplete()
  const attemptFail = useSubmitQuestAttemptFail()
  const battleIntel = useSubmitBattleIntel()
  const voidDuplicate = useVoidDuplicatePoolQuest()
  const dismissDuplicate = useDismissDuplicateDailyQuest()
  const syncStreak = useSyncStreakOnLoad()
  const dailyProvision = useAutoDailyProvision(profileQuery.data)

  useEffect(() => {
    if (!profileQuery.data || syncStreak.isPending || syncStreak.isSuccess) return
    syncStreak.mutate(profileQuery.data)
  }, [profileQuery.data, syncStreak])

  const handleResolveQuest = async (quest, status) => {
    if (!profileQuery.data) return
    await resolveQuest.mutateAsync({
      quest,
      status,
      profile: profileQuery.data,
    })
  }

  return (
    <section className="space-y-4">
      {dailyProvision.isPending ? (
        <p className="rounded-sm border border-[#1E2530] bg-[#12161D] px-3 py-2 font-mono text-xs text-[#7DD3FC]">
          Generating today&apos;s quests (pool, curiosity, recall)…
        </p>
      ) : null}
      {dailyProvision.isError ? (
        <div className="rounded-sm border border-[#FF4B4B]/40 bg-[#12161D] px-3 py-2 text-xs text-zinc-300">
          <p className="text-[#FF4B4B]">Could not generate today&apos;s quests: {dailyProvision.error.message}</p>
          <Button
            type="button"
            className="system-button mt-2 text-[10px]"
            onClick={() => dailyProvision.mutate({ force: true })}
          >
            RETRY
          </Button>
        </div>
      ) : null}
      <CipherDropBanner profile={profileQuery.data} />
      <CuriosityBanner profile={profileQuery.data} />
      <WeeklyQuotaPanel profile={profileQuery.data} />
      <QuestSectionTabs activeSection={activeSection} onSectionChange={setActiveSection} />

      {activeSection === 'task_pool' ? <TaskPoolSection raids={raidsQuery.data ?? []} /> : null}
      {activeSection === 'daily' ? (
        <>
          <ExtraDailyQuestPanel profile={profileQuery.data} />
          <RecallGate
            profile={profileQuery.data}
            onResolveQuest={handleResolveQuest}
            onBattleIntel={(quest, intel) => battleIntel.mutateAsync({ quest, intel })}
            onIncomplete={(quest, reason) =>
              incomplete.mutateAsync({ quest, reason, profile: profileQuery.data })
            }
            onAttemptFail={(quest, reason) =>
              attemptFail.mutateAsync({ quest, reason, profile: profileQuery.data })
            }
            isResolving={resolveQuest.isPending}
            isIncompletePending={incomplete.isPending}
            isAttemptFailPending={attemptFail.isPending}
            isBattleIntelPending={battleIntel.isPending}
            incompleteError={incomplete.error?.message}
            attemptFailError={attemptFail.error?.message}
            battleIntelError={battleIntel.error?.message}
          />
          <QuestBoard
            period="daily"
            onResolveQuest={handleResolveQuest}
            onBattleIntel={(quest, intel) => battleIntel.mutateAsync({ quest, intel })}
            onIncomplete={(quest, reason) =>
              incomplete.mutateAsync({ quest, reason, profile: profileQuery.data })
            }
            onAttemptFail={(quest, reason) =>
              attemptFail.mutateAsync({ quest, reason, profile: profileQuery.data })
            }
            onVoidDuplicate={(quest) => voidDuplicate.mutateAsync(quest.id)}
            onDismissDuplicate={(quest) => dismissDuplicate.mutateAsync(quest.id)}
            isResolving={resolveQuest.isPending}
            isVoidDuplicatePending={voidDuplicate.isPending}
            isDismissDuplicatePending={dismissDuplicate.isPending}
            voidDuplicateError={voidDuplicate.error?.message}
            dismissDuplicateError={dismissDuplicate.error?.message}
            isIncompletePending={incomplete.isPending}
            isAttemptFailPending={attemptFail.isPending}
            isBattleIntelPending={battleIntel.isPending}
            incompleteError={incomplete.error?.message}
            attemptFailError={attemptFail.error?.message}
            battleIntelError={battleIntel.error?.message}
          />
        </>
      ) : null}
      {activeSection === 'weekly' ? (
        <QuestBoard
          period="weekly"
          onResolveQuest={handleResolveQuest}
          onIncomplete={(quest, reason) =>
            incomplete.mutateAsync({ quest, reason, profile: profileQuery.data })
          }
          onAttemptFail={(quest, reason) =>
            attemptFail.mutateAsync({ quest, reason, profile: profileQuery.data })
          }
          isResolving={resolveQuest.isPending}
          isIncompletePending={incomplete.isPending}
          isAttemptFailPending={attemptFail.isPending}
          incompleteError={incomplete.error?.message}
          attemptFailError={attemptFail.error?.message}
        />
      ) : null}
      {activeSection === 'log' ? <QuestLogList /> : null}
    </section>
  )
}
