const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatCollectionMonthYear(month, year) {
  const m = Number(month)
  const y = Number(year)
  if (!Number.isFinite(m) || m < 1 || m > 12 || !Number.isFinite(y)) return '—'
  return `${MONTH_SHORT[m]} ${y}`
}

/** Human label for the exam/collection window (end optional while active). */
export function formatCollectionPeriodRange(period) {
  if (!period) return '—'
  const start = formatCollectionMonthYear(period.start_month, period.start_year)
  if (period.end_month == null || period.end_year == null) {
    return period.status === 'completed' ? `${start} – (open)` : `${start} – ongoing`
  }
  const end = formatCollectionMonthYear(period.end_month, period.end_year)
  return `${start} – ${end}`
}

export function sumCollectionEntryAmounts(entries) {
  return (entries ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
}

export function attachPeriodTotals(period, entries) {
  const periodEntries = (entries ?? []).filter((e) => e.period_id === period.id)
  return {
    ...period,
    entries: periodEntries,
    totalReceived: sumCollectionEntryAmounts(periodEntries),
    entryCount: periodEntries.length,
  }
}
