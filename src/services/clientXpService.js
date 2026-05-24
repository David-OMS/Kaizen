import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { addXP } from '@/services/xpService'
import { getRaidCompleteXp, getRaidStartXp } from '@/utils/xpAwards'

function raidCompleteLogMarker(clientId) {
  return `[raid:${clientId}]`
}

export async function hasRaidCompleteXpAwarded(clientId) {
  const userId = await getAuthenticatedUserId()
  const marker = raidCompleteLogMarker(clientId)
  const { data, error } = await supabase
    .from('xp_log')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', XP_EVENT_TYPES.RAID_COMPLETE)
    .like('description', `%${marker}%`)
    .limit(1)

  if (error) throw error
  return (data?.length ?? 0) > 0
}

export async function applyRaidStartXp(client) {
  if (client.raid_status !== 'ongoing') return
  const xpAmount = getRaidStartXp({
    raidRank: client.raid_rank,
    difficultyScore: client.difficulty_score,
  })
  await addXP(
    xpAmount,
    XP_EVENT_TYPES.CLIENT_SIGNED,
    `Raid started with ${client.name} [${client.raid_rank}-rank].`,
    {
      presentation: {
        kind: 'reward',
        title: 'Raid commenced',
        description: `Delivery begun on ${client.name} — ${client.raid_rank}-rank scope.`,
        category: 'raid',
      },
    },
  )
}

export async function applyRaidCompleteXp(client, { previousStatus } = {}) {
  if (client.raid_status !== 'completed') return
  if (previousStatus === 'completed') return
  if (await hasRaidCompleteXpAwarded(client.id)) return

  const rank = client.raid_rank || 'E'
  const xpAmount = getRaidCompleteXp({
    raidRank: rank,
    difficultyScore: client.difficulty_score,
  })
  const marker = raidCompleteLogMarker(client.id)

  await addXP(
    xpAmount,
    XP_EVENT_TYPES.RAID_COMPLETE,
    `Raid completed ${marker}: ${client.name} [${rank}-rank].`,
    {
      presentation: {
        kind: 'reward',
        title: 'Dungeon cleared',
        description: `The ${rank}-rank raid with ${client.name} is complete. Battle spoils were your loot in the dungeon — this is the boss clear bonus.`,
        category: 'raid',
      },
    },
  )
}
