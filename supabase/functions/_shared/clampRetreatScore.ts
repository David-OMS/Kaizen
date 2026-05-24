export type RetreatScore = {
  xpAward: number
  systemMessage: string
  effortTier: string
}

export const FALLBACK_RETREAT: RetreatScore = {
  xpAward: 12,
  systemMessage: 'The System logged a retreat. Experience noted.',
  effortTier: 'moderate',
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' ? Math.round(n) : Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, v))
}

function clampStr(s: unknown, max: number, fallback: string): string {
  const t = typeof s === 'string' ? s.trim() : ''
  if (!t) return fallback
  return t.slice(0, max)
}

export function clampRetreatScore(raw: Record<string, unknown>, maxXp: number): RetreatScore {
  return {
    xpAward: clampInt(raw.xpAward, 0, maxXp, FALLBACK_RETREAT.xpAward),
    systemMessage: clampStr(raw.systemMessage, 220, FALLBACK_RETREAT.systemMessage),
    effortTier: clampStr(raw.effortTier, 32, FALLBACK_RETREAT.effortTier),
  }
}
