/** Merges hunter vision + current goals for AI prompts (edge / cron). */
export function mergeHunterProfileContext(profile: {
  hunter_vision?: string | null
  hunter_goals?: string | null
} | null | undefined): string {
  const vision = (profile?.hunter_vision ?? '').trim()
  const goals = (profile?.hunter_goals ?? '').trim()
  if (!vision && !goals) return ''
  if (!vision) return goals
  if (!goals) return vision
  return `Vision (who I'm becoming):\n${vision}\n\nCurrent goals (next ~90 days):\n${goals}`
}
