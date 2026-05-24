import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import {
  HUNT_OUTCOME,
  isHuntPending,
  normalizeHuntOutcome,
} from '@/constants/huntOutcomes'
import { createClient } from '@/services/clientService'
import { createReachout, updateReachoutStatus } from '@/services/reachoutService'
import { applyRaidStartXp } from '@/services/clientXpService'
import { analyzeNewRaid } from '@/services/raidAnalysisOrchestrator'
import { addXP, enqueueXpRewardModal } from '@/services/xpService'
import {
  buildHuntLaunchReward,
  buildHuntOutcomeReward,
} from '@/utils/huntRewardPresentation'
import { getHuntLaunchXp, getHuntOutcomeXp } from '@/utils/xpAwards'

function invalidateReachoutQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reachouts })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
}

function invalidateRaidQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeCapacity })
}

function getOutcomeXpEventType(outcome) {
  const key = normalizeHuntOutcome(outcome)
  if (key === HUNT_OUTCOME.SUCCESSFUL) return XP_EVENT_TYPES.HUNT_OUTCOME_SUCCESSFUL
  if (key === HUNT_OUTCOME.REJECTED) return XP_EVENT_TYPES.HUNT_OUTCOME_REJECTED
  return XP_EVENT_TYPES.HUNT_OUTCOME_GHOSTED
}

export function useCreateReachout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      const reachout = await createReachout(payload)
      const fearLevel = reachout.fear_level ?? 3
      const xp = getHuntLaunchXp({ fearLevel })

      const reward = buildHuntLaunchReward({ xp, contactName: reachout.contact_name })
      const presentation = {
        kind: 'reward',
        title: reward.headline || reward.title,
        description: reward.flavor,
        category: 'hunt',
        alwaysShow: true,
      }

      if (xp > 0) {
        await addXP(xp, XP_EVENT_TYPES.HUNT_LAUNCHED, `Hunt launched: ${reachout.contact_name}.`, {
          presentation,
        })
      } else {
        enqueueXpRewardModal(presentation)
      }

      return { reachout }
    },
    onSuccess: () => {
      invalidateReachoutQueries(queryClient)
    },
  })
}

export function useFinalizeHuntOutcome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, outcome, notes, outcomeNotes, previousStatus }) => {
      if (!isHuntPending(previousStatus)) {
        throw new Error('This hunt already has a final outcome.')
      }

      const normalized = normalizeHuntOutcome(outcome)
      if (normalized === HUNT_OUTCOME.PENDING) {
        throw new Error('Choose a final outcome: successful, rejected, or ghosted.')
      }

      const reachout = await updateReachoutStatus({
        id,
        responseStatus: normalized,
        notes,
        outcomeNotes,
      })

      const fearLevel = reachout.fear_level ?? 3
      const xp = getHuntOutcomeXp({ outcome: normalized, fearLevel })
      const eventType = getOutcomeXpEventType(normalized)

      const reward = buildHuntOutcomeReward({
        xp,
        outcome: normalized,
        contactName: reachout.contact_name,
      })
      const presentation = {
        kind: 'reward',
        title: reward.headline || reward.title,
        description: reward.flavor,
        category: 'hunt',
        alwaysShow: true,
      }

      if (xp > 0) {
        await addXP(xp, eventType, `Hunt ${normalized} for ${reachout.contact_name}.`, { presentation })
      } else {
        enqueueXpRewardModal(presentation)
      }

      return { reachout }
    },
    onSuccess: () => {
      invalidateReachoutQueries(queryClient)
    },
  })
}

export function useConvertHuntToRaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      const marker = `[hunt:${payload.hunt.id}]`
      const raidNotes = payload.notes ? `${payload.notes}\n${marker}` : marker

      let raid = await createClient({
        name: payload.hunt.contact_name,
        projectName: payload.projectName || payload.hunt.company || '',
        status: 'ongoing',
        startDate: payload.startDate,
        contractValue: payload.contractValue,
        referralSource: payload.hunt.channel || null,
        notes: raidNotes,
      })

      const { client: analyzedRaid } = await analyzeNewRaid(raid)
      raid = analyzedRaid

      await applyRaidStartXp(raid)

      const updatedHunt = await updateReachoutStatus({
        id: payload.hunt.id,
        responseStatus: HUNT_OUTCOME.SUCCESSFUL,
        notes: payload.hunt.notes,
      })

      return { raid, updatedHunt }
    },
    onSuccess: () => {
      invalidateReachoutQueries(queryClient)
      invalidateRaidQueries(queryClient)
    },
  })
}
