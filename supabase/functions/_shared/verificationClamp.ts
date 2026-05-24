/** Clamp OpenAI skill verification grade JSON. */

export type GradeResult = {
  score: number
  passed: boolean
  rationale: string
}

export function clampVerificationGrade(raw: Record<string, unknown>, passThreshold: number): GradeResult {
  const scoreRaw = raw.score
  let score = typeof scoreRaw === 'number' ? scoreRaw : Number(scoreRaw)
  if (!Number.isFinite(score)) score = 0
  score = Math.min(100, Math.max(0, Math.round(score)))

  const rationale = typeof raw.rationale === 'string' ? raw.rationale.trim().slice(0, 500) : ''

  const passed = score >= passThreshold
  return { score, passed, rationale }
}

export const FALLBACK_GRADE: GradeResult = {
  score: 0,
  passed: false,
  rationale: 'Unable to grade automatically. Retry later.',
}
