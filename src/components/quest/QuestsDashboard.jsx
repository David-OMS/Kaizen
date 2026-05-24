import { useEffect, useState } from 'react'
import { QuestBoard } from '@/components/quest/QuestBoard'
import { QuestLogList } from '@/components/quest/QuestLogList'
import { QuestSectionTabs } from '@/components/quest/QuestSectionTabs'
import { TaskPoolSection } from '@/components/quest/TaskPoolSection'
import { useClients } from '@/hooks/useClients'
import { useResolveQuest, useSubmitQuestIncomplete } from '@/hooks/useQuestLifecycleMutations'
import { useSyncStreakOnLoad } from '@/hooks/useQuestMutations'
import { useProfile } from '@/hooks/useProfile'

export function QuestsDashboard() {
  const [activeSection, setActiveSection] = useState('task_pool')

  const profileQuery = useProfile()
  const raidsQuery = useClients()
  const resolveQuest = useResolveQuest()
  const incomplete = useSubmitQuestIncomplete()
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
      <QuestSectionTabs activeSection={activeSection} onSectionChange={setActiveSection} />

      {activeSection === 'task_pool' ? <TaskPoolSection raids={raidsQuery.data ?? []} /> : null}
      {activeSection === 'daily' ? (
        <QuestBoard
          period="daily"
          onResolveQuest={handleResolveQuest}
          onIncomplete={(quest, reason) =>
            incomplete.mutateAsync({ quest, reason, profile: profileQuery.data })
          }
          isResolving={resolveQuest.isPending}
          isIncompletePending={incomplete.isPending}
        />
      ) : null}
      {activeSection === 'weekly' ? (
        <QuestBoard
          period="weekly"
          onResolveQuest={handleResolveQuest}
          onIncomplete={(quest, reason) =>
            incomplete.mutateAsync({ quest, reason, profile: profileQuery.data })
          }
          isResolving={resolveQuest.isPending}
          isIncompletePending={incomplete.isPending}
        />
      ) : null}
      {activeSection === 'log' ? <QuestLogList /> : null}
    </section>
  )
}
