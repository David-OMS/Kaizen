import {
  milestonesDueForStreak,
  SAPIEN_STREAK_MILESTONES,
  SAPIEN_TIER_NAMING_HINT,
  sapienMilestoneCatalogKey,
} from '@/constants/sapienMilestones'
import { SAPIEN_XP_EVENT_TYPES } from '@/constants/sapienXpEvents'
import { invokeNameAchievement } from '@/services/aiAchievementNamingService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { addSapienXP } from '@/services/sapienXpService'
import {
  pickSapienMilestoneFallback,
  pickSapienMilestoneFallbackTagline,
} from '@/utils/sapienMilestoneFallback'
export async function getSapienHabitRewards(habitId) {
  const { data, error } = await supabase
    .from('sapien_habit_rewards')
    .select('*')
    .eq('habit_id', habitId)
    .order('milestone_days', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getRecentSapienRewards(limit = 8) {
  const { data, error } = await supabase
    .from('sapien_habit_rewards')
    .select('*, sapien_habits(title)')
    .order('unlocked_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

async function resolveMilestoneNaming(habit, milestone) {
  const catalogKey = sapienMilestoneCatalogKey(habit.id, milestone.days)
  const tierHint = SAPIEN_TIER_NAMING_HINT[milestone.tier] ?? ''
  const triggerHint = `${milestone.days}-day unbroken streak on habit "${habit.title}". ${tierHint} Sapien inner path — not Hunter quests, raids, or clients.`

  if (milestone.days < 10) {
    return {
      displayTitle: pickSapienMilestoneFallback(habit.title, milestone.days, milestone.tier),
      displayTagline: pickSapienMilestoneFallbackTagline(milestone.days),
      naming_snapshot: { fallback_used: true, tier: milestone.tier },
    }
  }

  try {
    const naming = await invokeNameAchievement({
      catalogKey,
      category: 'sapien',
      triggerHint,
    })
    return {
      displayTitle: naming.displayTitle,
      displayTagline: naming.displayTagline,
      naming_snapshot: {
        display_title: naming.displayTitle,
        display_tagline: naming.displayTagline,
        fallback_used: naming.fallbackUsed,
        variation_seed: naming.variationSeed,
        model: naming.model,
      },
    }
  } catch {
    return {
      displayTitle: pickSapienMilestoneFallback(habit.title, milestone.days, milestone.tier),
      displayTagline: pickSapienMilestoneFallbackTagline(milestone.days),
      naming_snapshot: { fallback_used: true, tier: milestone.tier },
    }
  }
}

export async function unlockDueSapienMilestones(habit, streakCurrent) {
  const existing = await getSapienHabitRewards(habit.id)
  const unlockedDays = new Set(existing.map((r) => r.milestone_days))
  const due = milestonesDueForStreak(streakCurrent, unlockedDays)

  if (!due.length) return []

  const userId = await getAuthenticatedUserId()
  const results = []

  for (const milestone of due) {
    const naming = await resolveMilestoneNaming(habit, milestone)

    const { data: row, error } = await supabase
      .from('sapien_habit_rewards')
      .insert({
        user_id: userId,
        habit_id: habit.id,
        milestone_days: milestone.days,
        display_title: naming.displayTitle,
        display_tagline: naming.displayTagline ?? null,
        xp_bonus: milestone.xpBonus,
        naming_snapshot: naming.naming_snapshot ?? null,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') continue
      throw error
    }

    await addSapienXP(
      milestone.xpBonus,
      SAPIEN_XP_EVENT_TYPES.STREAK_MILESTONE,
      naming.displayTagline || naming.displayTitle,
      {
        presentation: { title: naming.displayTitle, category: 'meta' },
      },
    )

    results.push(row)
  }

  return results
}
