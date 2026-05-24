import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { RANK_ORDER } from '@/constants/gamification'

function isRankEligible(unlockRank, currentRank) {
  if (!unlockRank) return false
  const requiredIdx = RANK_ORDER.indexOf(unlockRank)
  const currentIdx = RANK_ORDER.indexOf(currentRank)
  if (requiredIdx < 0 || currentIdx < 0) return false
  return currentIdx >= requiredIdx
}

export async function getLockedContent() {
  const { data, error } = await supabase
    .from('locked_content')
    .select('*')
    .order('unlocked', { ascending: true })
    .order('title', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function unlockLockedContentForRank(rankKey) {
  const userId = await getAuthenticatedUserId()
  const content = await getLockedContent()
  const unlockable = content.filter((item) => !item.unlocked && isRankEligible(item.unlock_rank, rankKey))

  if (!unlockable.length) return []

  const updates = await Promise.all(
    unlockable.map(async (item) => {
      const { data, error } = await supabase
        .from('locked_content')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) throw error
      return data
    }),
  )

  return updates
}