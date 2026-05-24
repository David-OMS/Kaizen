/**
 * Income signals for rank gates (B+). Uses claimed spoils + recurring accruals.
 * B gate enforcement toggled via B_INCOME_GATE_ENABLED in xpEngine constants.
 */

export function sumAmounts(rows, amountKey = 'amount') {
  return (rows ?? []).reduce((sum, row) => sum + Number(row[amountKey] || 0), 0)
}

/** Trailing calendar month total from dated rows (claimed_at / recorded_at ISO strings). */
export function sumInLastCalendarMonth(rows, dateKey, now = new Date()) {
  const end = now
  const start = new Date(end)
  start.setMonth(start.getMonth() - 1)

  return rows.reduce((sum, row) => {
    const raw = row[dateKey]
    if (!raw) return sum
    const d = new Date(raw)
    if (d >= start && d <= end) return sum + Number(row.amount || 0)
    return sum
  }, 0)
}

export function buildIncomeMetrics({ claimedSpoils = [], claimedAccruals = [], recurringMonthly = 0 }) {
  const spoilMonth = sumInLastCalendarMonth(claimedSpoils, 'recorded_at')
  const accrualMonth = sumInLastCalendarMonth(claimedAccruals, 'claimed_at')
  const monthlyIncomeNgn = spoilMonth + accrualMonth + Number(recurringMonthly || 0)

  return {
    monthlyIncomeNgn,
    spoilMonthNgn: spoilMonth,
    accrualMonthNgn: accrualMonth,
    lifetimeSpoilsNgn: sumAmounts(claimedSpoils),
    lifetimeAccrualsNgn: sumAmounts(claimedAccruals),
  }
}
