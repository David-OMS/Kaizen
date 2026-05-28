import { buildXpRewardSurprise } from '@/utils/xpRewardPresentation'
import { deriveSapienRankFromXp } from '@/utils/sapienRank'
import { enqueueSurprise } from '@/utils/surpriseQueue'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'

export async function addSapienXP(amount, eventType, description, options = {}) {
  const { data, error } = await supabase.rpc('add_sapien_xp', {
    p_amount: amount,
    p_event_type: eventType,
    p_description: description,
  })

  if (error) throw error

  const total = Number(data ?? 0)
  const derived = deriveSapienRankFromXp(total)
  const userId = await getAuthenticatedUserId()

  await supabase
    .from('profile')
    .update({
      sapien_xp: total,
      sapien_level: derived.level,
      sapien_rank: derived.rank.title,
    })
    .eq('id', userId)

  if (amount !== 0) {
    enqueueSurprise(
      buildXpRewardSurprise({
        amount,
        eventType,
        description,
        presentation: options.presentation ?? { title: 'Sapien gain', category: 'meta' },
      }),
    )
  }

  return total
}
