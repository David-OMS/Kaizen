import { xpPerClaimForHabit } from '@/constants/sapienHabitXp'
import { SAPIEN_XP_EVENT_TYPES } from '@/constants/sapienXpEvents'
import { unlockDueSapienMilestones } from '@/services/sapienMilestoneService'
import { refreshHabitStreak } from '@/services/sapienStreakService'
import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { addSapienXP } from '@/services/sapienXpService'
import { buildHabitProgress } from '@/services/sapienClaimProgress'
import { isHabitDueOnDate, todayYmd } from '@/utils/sapienSchedule'

export { buildHabitProgress } from '@/services/sapienClaimProgress'

export async function getSapienClaimsForDate(claimDate = todayYmd()) {
  const { data, error } = await supabase
    .from('sapien_claims')
    .select('*')
    .eq('claim_date', claimDate)
    .order('claimed_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function claimSapienHabit(habit) {
  const userId = await getAuthenticatedUserId()
  const claimDate = todayYmd()
  const due = isHabitDueOnDate(habit.schedule_days, new Date(`${claimDate}T12:00:00`))
  if (!due) throw new Error('Not scheduled for today.')

  const claims = await getSapienClaimsForDate(claimDate)
  const progress = buildHabitProgress(habit, claims, claimDate)
  if (progress.complete) throw new Error('Already complete for today.')

  const nextIndex = progress.count + 1
  const xp = xpPerClaimForHabit(habit)

  const { error: insErr } = await supabase.from('sapien_claims').insert({
    user_id: userId,
    habit_id: habit.id,
    claim_date: claimDate,
    claim_index: nextIndex,
    xp_amount: xp,
  })

  if (insErr) throw insErr

  const label =
    habit.habit_kind === 'count'
      ? `${habit.title} (${nextIndex}/${habit.target_count})`
      : habit.title

  const totalSapienXp = await addSapienXP(xp, SAPIEN_XP_EVENT_TYPES.HABIT_CLAIM, `Sapien habit: ${label}`)

  const afterClaims = await getSapienClaimsForDate(claimDate)
  const afterProgress = buildHabitProgress(habit, afterClaims, claimDate)

  let milestones = []
  let updatedHabit = habit

  if (afterProgress.complete) {
    const streakResult = await refreshHabitStreak(habit)
    updatedHabit = streakResult.habit
    milestones = await unlockDueSapienMilestones(updatedHabit, streakResult.streakCurrent)
  }

  return {
    claimIndex: nextIndex,
    xp,
    totalSapienXp,
    milestones,
    habit: updatedHabit,
  }
}
