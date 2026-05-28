import { QUEST_KIND } from '@/constants/questLifecycle'
import { mergeHunterProfileContext } from '@/utils/hunterProfile'

const LEARN_HINTS = /\b(learn|study|course|practice|language|french|design|postgres|dsa|exam)\b/i

export function inferTaskPoolFields({ title, contextNote, questKind, mandatory, linkedClientId, profile }) {
  const text = `${title} ${contextNote || ''}`.toLowerCase()
  const vision = mergeHunterProfileContext(profile).toLowerCase()

  const isLearning = questKind === QUEST_KIND.LEARNING
  const longTrack = isLearning || LEARN_HINTS.test(text)

  let type = 'daily_eligible'
  let repeatPolicy = 'until_completed'
  let inferredHorizon = 'one_off'
  let weeklyTargetDays = null
  let weeklyDistributionMode = 'adaptive'

  if (mandatory || linkedClientId) {
    type = 'daily_eligible'
    repeatPolicy = 'until_completed'
    inferredHorizon = 'one_off'
  } else if (longTrack) {
    type = 'weekly_eligible'
    repeatPolicy = 'always'
    inferredHorizon = 'long_track'
    weeklyTargetDays = isLearning ? 4 : 3
  }

  let goalAlignment = 40
  const tokens = text.split(/\W+/).filter((w) => w.length > 3)
  for (const token of tokens) {
    if (vision.includes(token)) goalAlignment += 8
  }
  goalAlignment = Math.min(100, goalAlignment)

  let inferredImportance = mandatory ? 90 : goalAlignment
  if (linkedClientId) inferredImportance = Math.max(inferredImportance, 85)
  if (isLearning) inferredImportance = Math.max(inferredImportance, 55)

  const priority = inferredImportance >= 75 ? 'high' : 'normal'

  return {
    type,
    repeat_policy: repeatPolicy,
    quest_kind: questKind || (isLearning ? QUEST_KIND.LEARNING : QUEST_KIND.EXECUTION),
    priority,
    weekly_target_days: weeklyTargetDays,
    weekly_distribution_mode: weeklyDistributionMode,
    inferred_horizon: inferredHorizon,
    inferred_importance: inferredImportance,
    goal_alignment_score: goalAlignment,
    ai_confidence: 0.65,
    ai_classified_at: new Date().toISOString(),
    focus_active: type === 'weekly_eligible' ? true : true,
  }
}
