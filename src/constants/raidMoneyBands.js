/** ₦ money bands → claim XP; one-off spoils use spoil multiplier. */

export const SPOIL_XP_MULTIPLIER = 1.25
export const MONEY_EVENT_XP_ABSOLUTE_MAX = 160

/** { minNgn inclusive, maxNgn inclusive (null = no upper), claimXp } */
export const RAID_MONEY_BANDS = [
  { minNgn: 0, maxNgn: 24_999, claimXp: 14 },
  { minNgn: 25_000, maxNgn: 49_999, claimXp: 22 },
  { minNgn: 50_000, maxNgn: 74_999, claimXp: 30 },
  { minNgn: 75_000, maxNgn: 99_999, claimXp: 42 },
  { minNgn: 100_000, maxNgn: 149_999, claimXp: 52 },
  { minNgn: 150_000, maxNgn: 249_999, claimXp: 64 },
  { minNgn: 250_000, maxNgn: 499_999, claimXp: 80 },
  { minNgn: 500_000, maxNgn: 999_999, claimXp: 95 },
  { minNgn: 1_000_000, maxNgn: 1_999_999, claimXp: 110 },
  { minNgn: 2_000_000, maxNgn: null, claimXp: 125 },
]
