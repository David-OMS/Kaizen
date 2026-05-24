import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { invalidateTreasuryLedger } from '@/utils/invalidateTreasuryLedger'
import {
  claimBattleSpoil,
  listRaidBattles,
  markBattleDelivered,
  retreatRaidBattle,
  startRaidBattle,
} from '@/services/raidBattleService'

function detailQueryKey(clientId) {
  return [...QUERY_KEYS.raidSpoils(clientId), 'detail']
}

function patchDetailCache(queryClient, clientId, patcher) {
  queryClient.setQueryData(detailQueryKey(clientId), (old) => {
    if (!old) return old
    return patcher(old)
  })
}

function invalidateRaidDetail(queryClient, clientId) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raidBattles(clientId) })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.raidSpoils(clientId) })
  queryClient.invalidateQueries({ queryKey: detailQueryKey(clientId) })
  queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.raidSpoils(clientId), 'panel'] })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.xpLog })
  invalidateTreasuryLedger(queryClient)
}

export function useRaidBattles(clientId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEYS.raidBattles(clientId),
    enabled: Boolean(clientId),
    queryFn: () => listRaidBattles(clientId),
  })

  const onSuccess = () => invalidateRaidDetail(queryClient, clientId)

  const startBattle = useMutation({
    mutationFn: startRaidBattle,
    onSuccess,
  })

  const markDelivered = useMutation({
    mutationFn: markBattleDelivered,
    onSuccess: (battle) => {
      patchDetailCache(queryClient, clientId, (old) => ({
        ...old,
        battles: old.battles.map((b) => (b.id === battle.id ? battle : b)),
      }))
      invalidateRaidDetail(queryClient, clientId)
    },
  })

  const retreat = useMutation({
    mutationFn: retreatRaidBattle,
    onSuccess,
  })

  const claimSpoil = useMutation({
    mutationFn: claimBattleSpoil,
    onSuccess: (result) => {
      patchDetailCache(queryClient, clientId, (old) => ({
        ...old,
        battles: old.battles.map((b) => (b.id === result.battle.id ? result.battle : b)),
        spoils: [result.spoil, ...old.spoils.filter((s) => s.id !== result.spoil.id)],
      }))
      invalidateRaidDetail(queryClient, clientId)
    },
  })

  return { query, startBattle, markDelivered, retreat, claimSpoil }
}
