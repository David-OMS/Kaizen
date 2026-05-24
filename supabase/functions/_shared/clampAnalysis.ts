/** Normalizes Quest Analyzer output (Core Engine V2 plan §5.1). */

export const QUEST_CATEGORIES = ['build', 'outreach', 'learning', 'admin'] as const
export type QuestCategory = (typeof QUEST_CATEGORIES)[number]

export type QuestSkillImpact = {
  primarySkill: string | null
  secondarySkill: string | null
  unlockCandidate: boolean
}

export type QuestAnalysis = {
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  fearLevel: number
  category: QuestCategory
  skillImpact: QuestSkillImpact | null
  confidence: number
}

export const FALLBACK_QUEST: QuestAnalysis = {
  difficulty: 'medium',
  fearLevel: 2,
  category: 'admin',
  skillImpact: null,
  confidence: 0,
}

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const

export type RaidAnalysis = {
  difficultyScore: number
  rank: (typeof RANKS)[number]
  suggestedDurationMinutes: number
  estimatedXPBase: number
  suggestedSkillImpact: { primarySkill: string | null; secondarySkill: string | null } | null
}

export const FALLBACK_RAID: RaidAnalysis = {
  difficultyScore: 40,
  rank: 'E',
  suggestedDurationMinutes: 60,
  estimatedXPBase: 80,
  suggestedSkillImpact: null,
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const x = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(x)) return fallback
  return Math.min(max, Math.max(min, Math.round(x)))
}

function clamp01(n: unknown): number {
  const x = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.min(1, Math.max(0, x))
}

export function clampQuestAnalysis(raw: Record<string, unknown>): QuestAnalysis {
  const d = raw.difficulty
  const difficulty =
    d === 'easy' || d === 'medium' || d === 'hard' || d === 'legendary' ? d : FALLBACK_QUEST.difficulty

  let category = raw.category as string
  if (!QUEST_CATEGORIES.includes(category as QuestCategory)) category = FALLBACK_QUEST.category

  let skillImpact: QuestSkillImpact | null = null
  const si = raw.skillImpact
  if (si && typeof si === 'object' && si !== null) {
    const o = si as Record<string, unknown>
    const primary = o.primarySkill
    const secondary = o.secondarySkill
    skillImpact = {
      primarySkill: typeof primary === 'string' && primary.trim() ? primary.trim().slice(0, 80) : null,
      secondarySkill: typeof secondary === 'string' && secondary.trim() ? secondary.trim().slice(0, 80) : null,
      unlockCandidate: Boolean(o.unlockCandidate),
    }
    if (!skillImpact.primarySkill && !skillImpact.secondarySkill) skillImpact = null
  }

  return {
    difficulty,
    fearLevel: clampInt(raw.fearLevel, 1, 5, FALLBACK_QUEST.fearLevel),
    category: category as QuestCategory,
    skillImpact,
    confidence: clamp01(raw.confidence),
  }
}

export function clampRaidAnalysis(raw: Record<string, unknown>): RaidAnalysis {
  let rank = String(raw.rank ?? '').toUpperCase()
  if (!RANKS.includes(rank as (typeof RANKS)[number])) rank = FALLBACK_RAID.rank

  let suggested: RaidAnalysis['suggestedSkillImpact'] = null
  const sug = raw.suggestedSkillImpact
  if (sug && typeof sug === 'object' && sug !== null) {
    const o = sug as Record<string, unknown>
    const p = o.primarySkill
    const s = o.secondarySkill
    suggested = {
      primarySkill: typeof p === 'string' && p.trim() ? p.trim().slice(0, 80) : null,
      secondarySkill: typeof s === 'string' && s.trim() ? s.trim().slice(0, 80) : null,
    }
    if (!suggested.primarySkill && !suggested.secondarySkill) suggested = null
  }

  return {
    difficultyScore: clampInt(raw.difficultyScore, 0, 100, FALLBACK_RAID.difficultyScore),
    rank: rank as (typeof RANKS)[number],
    suggestedDurationMinutes: clampInt(raw.suggestedDurationMinutes, 5, 24 * 60, FALLBACK_RAID.suggestedDurationMinutes),
    estimatedXPBase: clampInt(raw.estimatedXPBase, 0, 5000, FALLBACK_RAID.estimatedXPBase),
    suggestedSkillImpact: suggested,
  }
}
