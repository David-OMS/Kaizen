import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import {
  activateSkillArc,
  attachSkillArcQuests,
  createSkillArc,
  finalizeArcUnlock,
  updateSkillArcStatus,
} from '@/services/skillArcService'

function invalidateArcs(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skillArcs })
}

export function useCreateSkillArc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSkillArc,
    onSuccess: () => {
      invalidateArcs(queryClient)
    },
  })
}

export function useUpdateSkillArcStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => updateSkillArcStatus(id, status),
    onSuccess: () => {
      invalidateArcs(queryClient)
    },
  })
}

export function useAttachSkillArcQuests() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ arcId, weeklyQuestId, dailyQuestIds }) =>
      attachSkillArcQuests(arcId, { weeklyQuestId, dailyQuestIds }),
    onSuccess: () => {
      invalidateArcs(queryClient)
    },
  })
}

export function useActivateSkillArc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (arcId) => activateSkillArc(arcId),
    onSuccess: () => {
      invalidateArcs(queryClient)
    },
  })
}

export function useFinalizeArcUnlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (arcId) => finalizeArcUnlock(arcId),
    onSuccess: () => {
      invalidateArcs(queryClient)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills })
    },
  })
}
