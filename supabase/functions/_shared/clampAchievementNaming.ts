export type AchievementNaming = {
  displayTitle: string
  displayTagline: string
}

export const FALLBACK_ACHIEVEMENT: AchievementNaming = {
  displayTitle: 'System Notice',
  displayTagline: 'The System recorded a milestone.',
}

function clampStr(s: unknown, max: number, fallback: string): string {
  const t = typeof s === 'string' ? s.trim() : ''
  if (!t) return fallback
  return t.slice(0, max)
}

export function clampAchievementNaming(raw: Record<string, unknown>): AchievementNaming {
  return {
    displayTitle: clampStr(raw.displayTitle, 56, FALLBACK_ACHIEVEMENT.displayTitle),
    displayTagline: clampStr(raw.displayTagline, 200, FALLBACK_ACHIEVEMENT.displayTagline),
  }
}
