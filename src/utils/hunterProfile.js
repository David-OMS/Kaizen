/**
 * Merges hunter vision + current goals for AI prompts and alignment scoring.
 */
export function mergeHunterProfileContext(profile) {
  const vision = (profile?.hunter_vision ?? '').trim()
  const goals = (profile?.hunter_goals ?? '').trim()
  if (!vision && !goals) return ''
  if (!vision) return goals
  if (!goals) return vision
  return `Vision (who I'm becoming):\n${vision}\n\nCurrent goals (next ~90 days):\n${goals}`
}
