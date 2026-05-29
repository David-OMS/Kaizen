import { useEffect, useState } from 'react'
import { CuriosityBanner } from '@/components/quest/CuriosityBanner'
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
} from '@/hooks/useQuestLifecycleMutations'
import { useSyncStreakOnLoad } from '@/hooks/useQuestMutations'
import { useProfile } from '@/hooks/useProfile'

export function QuestsDashboard() {
  const [activeSection, setActiveSection] = useState('task_pool')

  const profileQuery = useProfile()
  const raidsQuery = useClients()
  const resolveQuest = useResolveQuest()
  const incomplete = useSubmitQuestIncomplete()
  const attemptFail = useSubmitQuestAttemptFail()
  const battleIntel = useSubmitBattleIntel()
  const syncStreak = useSyncStreakOnLoad()

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
      <CuriosityBanner profile={profileQuery.data} />
      <QuestSectionTabs activeSection={activeSection} onSectionChange={setActiveSection} />

      {activeSection === 'task_pool' ? <TaskPoolSection raids={raidsQuery.data ?? []} /> : null}
      {activeSection === 'daily' ? (
        <>
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
            isResolving={resolveQuest.isPending}
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
