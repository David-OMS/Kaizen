import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { supabase } from '@/services/supabase'
import {
  pickAchievementFallback,
  pickAchievementFallbackTagline,
} from '@/utils/achievementNamingFallback'
import { randomId } from '@/utils/randomId'

export async function invokeNameAchievement({ catalogKey, category, triggerHint }) {
  const variationSeed = randomId()

  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.NAME_ACHIEVEMENT, {
    body: {
      catalogKey,
      category,
      triggerHint,
      variationSeed,
    },
  })

  if (error || !data?.naming) {
    return {
      displayTitle: pickAchievementFallback(catalogKey),
      displayTagline: pickAchievementFallbackTagline(catalogKey),
      fallbackUsed: true,
      variationSeed,
      model: null,
    }
  }

  return {
    displayTitle: data.naming.displayTitle,
    displayTagline: data.naming.displayTagline,
    fallbackUsed: Boolean(data.fallbackUsed),
    variationSeed: data.variationSeed ?? variationSeed,
    model: data.model ?? null,
  }
}
