import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { mergeHunterProfileContext } from '@/utils/hunterProfile'
import { supabase } from '@/services/supabase'

const FALLBACK = {
  title: 'Sunday journal — what are you avoiding?',
  journalPrompt:
    'Write for 10–15 minutes about something you keep putting off that connects to your current goals. Be specific: what is it, why does it matter, and what is one honest reason you have not moved on it yet?',
}

export async function invokePickSundayMentalQuest({ profile }) {
  try {
    const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.PICK_SUNDAY_MENTAL, {
      body: {
        hunterVision: mergeHunterProfileContext(profile),
        hunterGoals: profile?.hunter_goals || '',
      },
    })

    if (error || !data?.title) return FALLBACK

    return {
      title: String(data.title).slice(0, 120),
      journalPrompt: String(data.journalPrompt || data.journal_prompt || FALLBACK.journalPrompt).slice(
        0,
        600,
      ),
    }
  } catch {
    return FALLBACK
  }
}
