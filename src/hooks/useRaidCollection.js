import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import {
  addRaidCollectionEntry,
  completeRaidCollectionPeriod,
  createRaidCollectionPeriod,
  fetchRaidCollectionPanel,
} from '@/services/raidCollectionService'
import { invalidateTreasuryLedger } from '@/utils/invalidateTreasuryLedger'

function invalidateRaidCollection(queryClient, clientId) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raidCollection(clientId) })
  queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.raidSpoils(clientId), 'detail'] })
  invalidateTreasuryLedger(queryClient)
}

export function useRaidCollection(clientId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEYS.raidCollection(clientId),
    enabled: Boolean(clientId),
    queryFn: () => fetchRaidCollectionPanel(clientId),
  })

  const createPeriod = useMutation({
    mutationFn: (payload) => createRaidCollectionPeriod({ clientId, ...payload }),
    onSuccess: () => invalidateRaidCollection(queryClient, clientId),
  })

  const completePeriod = useMutation({
    mutationFn: ({ periodId, endMonth, endYear }) =>
      completeRaidCollectionPeriod(periodId, { endMonth, endYear }),
    onSuccess: () => invalidateRaidCollection(queryClient, clientId),
  })

  const addEntry = useMutation({
    mutationFn: addRaidCollectionEntry,
    onSuccess: () => invalidateRaidCollection(queryClient, clientId),
  })

  return { query, createPeriod, completePeriod, addEntry }
}
