import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { QUEST_LOG_OUTCOME, QUEST_STATUS } from '@/constants/questLifecycle'
import { submitQuestAttemptFail } from '@/services/questAttemptFailService'
import { submitQuestIncomplete } from '@/services/questIncompleteService'
import {
  generateQuestAssessment,
  submitBattleIntel,
  submitQuestAssessment,
} from '@/services/questAssessmentService'
import {
  appendQuestLogEntry,
  hasCompletedDailyOnYmd,
  updateQuestRow,
  updateQuestStatus,
  dismissDuplicateDailyQuest,
  voidDuplicatePoolQuest,
} from '@/services/questService'
import { bumpDailyStreak } from '@/services/profileService'
import { getProfileTimezone, getTodayYmdInTimezone } from '@/utils/questTimezone'
import { applyTaskPoolOutcomeOnQuestSuccess } from '@/services/taskPoolOutcomeOnSuccess'
import { updateTaskPoolOutcome } from '@/services/taskPoolService'
import { TASK_POOL_OUTCOME } from '@/constants/questLifecycle'
import {
  getQuestPenaltyXp,
  grantQuestXp,
  isLearningQuest,
  resolveExecutionQuestXp,
} from '@/services/questRewardService'
import { QUEST_PERIODS } from '@/constants/questOptions'

function invalidateQuests(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.weeklyQuests })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.questLog })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.taskPool })
}

export function useSubmitBattleIntel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quest, battleIntel }) => submitBattleIntel(quest, battleIntel),
    onSuccess: () => invalidateQuests(queryClient),
  })
}

export function useResolveQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ quest, status, profile }) => {
      if (status === 'completed' && isLearningQuest(quest)) {
        throw new Error('LEARNING_NEEDS_BATTLE_INTEL')
      }

      const tz = getProfileTimezone(profile)
      const firstDailyToday =
        quest.period !== QUEST_PERIODS.DAILY ||
        !(await hasCompletedDailyOnYmd(getTodayYmdInTimezone(tz)))

      const completedAt = status === 'completed' ? new Date().toISOString() : null
      const nextStatus = status === 'completed' ? QUEST_STATUS.COMPLETED : QUEST_STATUS.FAILED
      const row = await updateQuestStatus({
        id: quest.id,
        status: nextStatus,
        completedAt,
      })

      const xpMeta = resolveExecutionQuestXp(quest)
      const xpDelta =
        status === 'completed' ? xpMeta.reward : -xpMeta.penalty || getQuestPenaltyXp(quest.period, 'failed')

      if (status === 'completed') {
        await appendQuestLogEntry({
          questId: quest.id,
          title: quest.title,
          period: quest.period,
          outcome: QUEST_LOG_OUTCOME.COMPLETED,
          xpDelta,
        })
        await grantQuestXp({
          amount: xpDelta,
          period: quest.period,
          description: `${quest.period} quest completed: ${quest.title}`,
        })
        if (firstDailyToday) await bumpDailyStreak(profile)
        if (quest.task_pool_id) {
          await applyTaskPoolOutcomeOnQuestSuccess(quest)
        }
      } else {
        await appendQuestLogEntry({
          questId: quest.id,
          title: quest.title,
          period: quest.period,
          outcome: QUEST_LOG_OUTCOME.FAILED,
          xpDelta,
        })
        await grantQuestXp({
          amount: xpDelta,
          period: quest.period,
          description: `${quest.period} quest failed: ${quest.title}`,
        })
        if (quest.task_pool_id) {
          const isWeeklySession = Boolean(quest.analysis_snapshot?.weekly_session)
          if (!isWeeklySession) {
            await updateTaskPoolOutcome(quest.task_pool_id, {
              lastOutcome: TASK_POOL_OUTCOME.FAILED,
              incrementDrop: true,
            })
          }
        }
      }

      return row
    },
    onSuccess: () => invalidateQuests(queryClient),
  })
}

export function useSubmitQuestIncomplete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quest, reason, profile }) => submitQuestIncomplete({ quest, reason, profile }),
    onSuccess: () => invalidateQuests(queryClient),
  })
}

export function useSubmitQuestAttemptFail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quest, reason, profile }) => submitQuestAttemptFail({ quest, reason, profile }),
    onSuccess: () => invalidateQuests(queryClient),
  })
}

export function useQuestAssessment() {
  const queryClient = useQueryClient()
  const gen = useMutation({
    mutationFn: (quest) => generateQuestAssessment(quest),
  })
  const submit = useMutation({
    mutationFn: ({ quest, answers, profile }) => submitQuestAssessment({ quest, answers, profile }),
    onSuccess: () => invalidateQuests(queryClient),
  })
  return { gen, submit }
}

export function useVoidDuplicatePoolQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questId) => voidDuplicatePoolQuest(questId),
    onSuccess: () => invalidateQuests(queryClient),
  })
}

export function useDismissDuplicateDailyQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questId) => dismissDuplicateDailyQuest(questId),
    onSuccess: () => invalidateQuests(queryClient),
  })
}

export function useStartQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (quest) =>
      updateQuestRow(quest.id, { started_at: new Date().toISOString() }),
    onSuccess: () => invalidateQuests(queryClient),
  })
}
