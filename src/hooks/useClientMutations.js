import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { createClient, updateClient } from '@/services/clientService'
import { applyRaidCompleteXp, applyRaidStartXp } from '@/services/clientXpService'
import { analyzeNewRaid } from '@/services/raidAnalysisOrchestrator'

async function applyClientCreationXp(client) {
  await applyRaidStartXp(client)
}

async function applyClientUpdateXp(updatedClient, previousStatus) {
  if (updatedClient.raid_status === 'ongoing' && previousStatus !== 'ongoing') {
    await applyRaidStartXp(updatedClient)
  }
  if (updatedClient.raid_status === 'completed' && previousStatus !== 'completed') {
    await applyRaidCompleteXp(updatedClient, { previousStatus })
  }
}

function invalidateFieldQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeCapacity })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      let client = await createClient(payload)
      const { client: analyzed } = await analyzeNewRaid(client)
      client = analyzed
      await applyClientCreationXp(client)
      return client
    },
    onSuccess: () => {
      invalidateFieldQueries(queryClient)
    },
  })
}

export function useBeginRaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client) => {
      const updated = await updateClient({
        id: client.id,
        name: client.name,
        projectName: client.project_name,
        status: 'ongoing',
        startDate: client.start_date || new Date().toISOString().slice(0, 10),
        contractValue: client.contract_value,
        referralSource: client.referral_source,
        notes: client.notes,
        raidRank: client.raid_rank,
      })
      await applyClientUpdateXp(updated, client.raid_status)
      return updated
    },
    onSuccess: () => {
      invalidateFieldQueries(queryClient)
    },
  })
}

export function useCompleteRaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client) => {
      const updated = await updateClient({
        id: client.id,
        name: client.name,
        projectName: client.project_name,
        status: 'completed',
        startDate: client.start_date,
        contractValue: client.contract_value,
        referralSource: client.referral_source,
        notes: client.notes,
        raidRank: client.raid_rank,
      })
      await applyClientUpdateXp(updated, client.raid_status)
      return updated
    },
    onSuccess: () => {
      invalidateFieldQueries(queryClient)
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      const updated = await updateClient(payload)
      await applyClientUpdateXp(updated, payload.previousStatus)
      return updated
    },
    onSuccess: () => {
      invalidateFieldQueries(queryClient)
    },
  })
}