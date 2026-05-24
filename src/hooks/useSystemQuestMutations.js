import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { SYSTEM_QUEST_REJECT_EVENT, SYSTEM_QUEST_REJECT_XP } from '@/constants/systemQuest'
import {
  acceptSystemQuest,
  appendQuestLogEntry,
  createSystemGeneratedQuest,
  getPendingSystemQuestsToday,
  rejectSystemQuest,
} from '@/services/questService'
import { addXP } from '@/services/xpService'

function invalidateQuestSurface(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyQuests })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.weeklyQuests })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.questLog })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
}

export function useAcceptSystemQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questId) => acceptSystemQuest(questId),
    onSuccess: () => {
      invalidateQuestSurface(queryClient)
    },
  })
}

export function useRejectSystemQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (quest) => {
      await rejectSystemQuest(quest.id)
      await appendQuestLogEntry({
        questId: quest.id,
        title: quest.title,
        period: quest.period,
        outcome: 'failed',
        xpDelta: SYSTEM_QUEST_REJECT_XP,
      })
      await addXP(SYSTEM_QUEST_REJECT_XP, SYSTEM_QUEST_REJECT_EVENT, `System quest rejected: ${quest.title}`)
    },
    onSuccess: () => {
      invalidateQuestSurface(queryClient)
    },
  })
}

export function useSummonSystemQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const pending = await getPendingSystemQuestsToday()
      if (pending.length) {
        throw new Error('A pending system quest already exists today.')
      }
      return createSystemGeneratedQuest({
        title: 'System trial: prove execution under pressure',
        rewardVisibility: 'unknown',
      })
    },
    onSuccess: () => {
      invalidateQuestSurface(queryClient)
    },
  })
}
