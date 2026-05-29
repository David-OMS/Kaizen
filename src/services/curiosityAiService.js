import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { mergeHunterProfileContext } from '@/utils/hunterProfile'
import { supabase } from '@/services/supabase'

export async function invokePickCuriosityThemes({
  pick,
  booksDone = [],
  countriesDone = [],
  professionsDone = [],
  profile,
}) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.PICK_CURIOSITY, {
    body: {
      pick,
      hunterVision: mergeHunterProfileContext(profile),
      hunterGoals: profile?.hunter_goals || '',
      booksDone,
      countriesDone,
      professionsDone,
    },
  })

  if (error) throw error
  return data ?? {}
}
