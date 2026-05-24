import { ACHIEVEMENT_CATEGORIES as C } from '@/constants/achievementTypes'

/** Stable key suffix from NGN amount (e.g. 1_000_000 → 1M, 750_000 → 750K). */
export function treasuryAmountKey(amountNgn) {
  if (amountNgn >= 1_000_000 && amountNgn % 1_000_000 === 0) {
    return `${amountNgn / 1_000_000}M`
  }
  if (amountNgn >= 1_000 && amountNgn % 1_000 === 0) {
    return `${amountNgn / 1_000}K`
  }
  return String(amountNgn)
}

function xpForRevenueTier(amountNgn, index, { month }) {
  const base = month ? 45 : 55
  const step = month ? 22 : 28
  const tierBonus = Math.min(320, Math.floor(index / 2) * step)
  const scale =
    amountNgn >= 100_000_000 ? 120 : amountNgn >= 50_000_000 ? 90 : amountNgn >= 10_000_000 ? 55 : 0
  return Math.min(650, base + tierBonus + scale)
}

function buildRevenueTiers(prefix, scope, amountsNgn) {
  return amountsNgn.map((amountNgn, index) => {
    const suffix = treasuryAmountKey(amountNgn)
    const key = `${prefix}_${suffix}`
    const scopeLabel = scope === 'lifetime' ? 'Lifetime vault received' : 'Received this calendar month'
    return {
      key,
      amountNgn,
      scope,
      legacyTitle: scope === 'lifetime' ? `Vault ${suffix}` : `Month ${suffix}`,
      triggerHint: `${scopeLabel} crosses ₦${amountNgn.toLocaleString('en-NG')}.`,
      xpReward: xpForRevenueTier(amountNgn, index, { month: scope === 'month' }),
      secret: true,
      category: C.TREASURY,
    }
  })
}

/** Since founding — spoils + claimed tribute (not capped at 1M). */
const LIFETIME_AMOUNTS_NGN = [
  100_000, 250_000, 500_000, 750_000,
  1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000,
  9_000_000, 10_000_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000, 40_000_000,
  50_000_000, 75_000_000, 100_000_000, 150_000_000, 200_000_000, 250_000_000, 500_000_000,
]

/** This calendar month only — separate ladder from lifetime. */
const MONTH_AMOUNTS_NGN = [
  100_000, 250_000, 500_000, 750_000,
  1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000,
  9_000_000, 10_000_000, 12_000_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000,
  40_000_000, 50_000_000, 75_000_000, 100_000_000,
]

export const TREASURY_LIFETIME_TIERS = buildRevenueTiers('TREASURY_VAULT', 'lifetime', LIFETIME_AMOUNTS_NGN)
export const TREASURY_MONTH_TIERS = buildRevenueTiers('TREASURY_MONTH', 'month', MONTH_AMOUNTS_NGN)

export const TREASURY_REVENUE_MILESTONE_DEFS = [
  ...TREASURY_LIFETIME_TIERS,
  ...TREASURY_MONTH_TIERS,
]

export const TREASURY_VAULT_LIFETIME_KEYS = TREASURY_LIFETIME_TIERS.map((t) => t.key)
export const TREASURY_MONTH_REVENUE_KEYS = TREASURY_MONTH_TIERS.map((t) => t.key)

export const TREASURY_LIFETIME_TOP_NGN =
  TREASURY_LIFETIME_TIERS[TREASURY_LIFETIME_TIERS.length - 1]?.amountNgn ?? 0

export const TREASURY_MONTH_TOP_NGN =
  TREASURY_MONTH_TIERS[TREASURY_MONTH_TIERS.length - 1]?.amountNgn ?? 0
