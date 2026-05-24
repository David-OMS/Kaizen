function isDateInCurrentMonth(dateText) {
  if (!dateText) return false
  const date = new Date(dateText)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function getTreasurySummary({ income, expenses, revenueTargetMonthly }) {
  const expectedTotal = income
    .filter((entry) => isDateInCurrentMonth(entry.expected_date))
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

  const receivedTotal = income
    .filter((entry) => isDateInCurrentMonth(entry.received_date))
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

  const expensesTotal = expenses
    .filter((entry) => isDateInCurrentMonth(entry.date))
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

  const net = receivedTotal - expensesTotal
  const revenueTarget = Number(revenueTargetMonthly || 0)
  const revenueProgress = revenueTarget > 0 ? Math.min(100, Math.round((receivedTotal / revenueTarget) * 100)) : 0

  return {
    expectedTotal,
    receivedTotal,
    expensesTotal,
    net,
    revenueTarget,
    revenueProgress,
  }
}

export function getOutstandingIncomeEntries(income) {
  const today = new Date().toISOString().slice(0, 10)

  return income.filter((entry) => {
    if (entry.status === 'overdue') return true
    return entry.status === 'expected' && entry.expected_date && entry.expected_date < today
  })
}