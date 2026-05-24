import { supabase } from '@/services/supabase'
import { RANK_ORDER } from '@/constants/gamification'
import { buildXpRewardSurprise } from '@/utils/xpRewardPresentation'
import { enqueueSurprise } from '@/utils/surpriseQueue'

export async function addXPBase(amount, eventType, description) {
  const { data, error } = await supabase.rpc('add_xp', {
    p_amount: amount,
    p_event_type: eventType,
    p_description: description,
  })

  if (error) throw error
  return data
}

function shouldEnqueueReward(amount, options = {}) {
  if (options.skipRewardModal) return false
  if (options.presentation) return true
  return amount !== 0
}

function enqueueRewardModal(amount, eventType, description, options = {}) {
  if (!shouldEnqueueReward(amount, options)) return
  enqueueSurprise(
    buildXpRewardSurprise({
      amount,
      eventType,
      description,
      presentation: options.presentation,
    }),
  )
}

/** Show reward modal without writing XP (e.g. retreat scored 0). */
export function enqueueXpRewardModal(presentation) {
  enqueueSurprise(
    buildXpRewardSurprise({
      amount: 0,
      presentation: { ...presentation, alwaysShow: true },
    }),
  )
}

export async function addXP(amount, eventType, description, options = {}) {
  if (amount !== 0) {
    const totalXp = await addXPBase(amount, eventType, description)

    if (!options.skipPostChecks) {
      const { syncProfileProgression } = await import('./progressionService.js')
      await syncProfileProgression(totalXp, RANK_ORDER)

      const { runPostXpChecks } = await import('./gamificationService.js')
      await runPostXpChecks({
        eventType,
        totalXp,
      })
    }

    enqueueRewardModal(amount, eventType, description, options)

    return totalXp
  }

  enqueueRewardModal(0, eventType, description, options)

  if (!options.skipPostChecks) {
    const { runPostXpChecks } = await import('./gamificationService.js')
    await runPostXpChecks({
      eventType,
      totalXp: null,
    })
  }

  return 0
}
