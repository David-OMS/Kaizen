import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { invalidateTreasuryLedger } from '@/utils/invalidateTreasuryLedger'
import {
  claimRecurringAccrual,
  createRecurringStream,
  ensureAccrualsForClient,
  listAccrualsGroupedByStream,
  listRecurringStreams,
  updateRecurringStreamAmount,
} from '@/services/raidRecurringService'
import { listRaidSpoils } from '@/services/raidSpoilService'

function panelQueryKey(clientId) {
  return [...QUERY_KEYS.raidSpoils(clientId), 'panel']
}

export function useRaidSpoilsPanel(clientId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: panelQueryKey(clientId),
    enabled: Boolean(clientId),
    queryFn: async () => {
      await ensureAccrualsForClient(clientId)
      const [spoils, streams, accrualsByStream] = await Promise.all([
        listRaidSpoils(clientId),
        listRecurringStreams(clientId),
        listAccrualsGroupedByStream(clientId),
      ])
      return { spoils, streams, accrualsByStream }
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raidSpoils(clientId) })
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.raidSpoils(clientId), 'detail'] })
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.raidSpoils(clientId), 'panel'] })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.xpLog })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rankGateAudit })
    invalidateTreasuryLedger(queryClient)
  }

  const createStream = useMutation({
    mutationFn: (payload) => createRecurringStream(payload),
    onSuccess: invalidate,
  })

  const claimAccrual = useMutation({
    mutationFn: (accrualId) => claimRecurringAccrual(accrualId),
    onSuccess: invalidate,
  })

  const patchStreamAmount = useMutation({
    mutationFn: ({ streamId, amount }) => updateRecurringStreamAmount(streamId, amount),
    onSuccess: invalidate,
  })

  return { query, createStream, claimAccrual, patchStreamAmount }
}
