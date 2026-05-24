import {
  MONEY_EVENT_XP_ABSOLUTE_MAX,
  RAID_MONEY_BANDS,
  SPOIL_XP_MULTIPLIER,
} from '@/constants/raidMoneyBands'

export function getClaimXpForAmount(amountNgn) {
  const n = Number(amountNgn)
  if (!Number.isFinite(n) || n < 0) return 0

  const band = RAID_MONEY_BANDS.find((b) => {
    if (n < b.minNgn) return false
    if (b.maxNgn == null) return true
    return n <= b.maxNgn
  })

  const base = band?.claimXp ?? RAID_MONEY_BANDS[0].claimXp
  return Math.min(MONEY_EVENT_XP_ABSOLUTE_MAX, base)
}

export function getSpoilXpForAmount(amountNgn) {
  const claim = getClaimXpForAmount(amountNgn)
  return Math.min(MONEY_EVENT_XP_ABSOLUTE_MAX, Math.round(claim * SPOIL_XP_MULTIPLIER))
}
