import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { listRaidBattles, reconcileBattlesWithLinkedSpoils } from '@/services/raidBattleService'
import { ensureAccrualsForClient, listAccrualsGroupedByStream, listRecurringStreams } from '@/services/raidRecurringService'
import { listRaidSpoils } from '@/services/raidSpoilService'
import { buildRaidChronicle } from '@/utils/buildRaidChronicle'

export function useRaidDetail(client) {
  const clientId = client?.id

  return useQuery({
    queryKey: [...QUERY_KEYS.raidSpoils(clientId), 'detail'],
    enabled: Boolean(clientId),
    queryFn: async () => {
      await ensureAccrualsForClient(clientId)
      const [rawBattles, spoils, streams, accrualsByStream] = await Promise.all([
        listRaidBattles(clientId),
        listRaidSpoils(clientId),
        listRecurringStreams(clientId),
        listAccrualsGroupedByStream(clientId),
      ])
      const battles = await reconcileBattlesWithLinkedSpoils(rawBattles, spoils)

      const accruals = Object.values(accrualsByStream).flat()
      const chronicle = buildRaidChronicle({ client, battles, spoils, accruals })

      return { battles, spoils, streams, accrualsByStream, chronicle }
    },
  })
}
