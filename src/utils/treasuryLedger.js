import { RAID_BATTLE_STATUS } from '@/constants/raidBattleStatuses'
import { isClaimable } from '@/utils/raidRecurringLagos'

function monthKey(isoOrDate) {
  if (!isoOrDate) return null
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isInMonth(isoOrDate, key) {
  return monthKey(isoOrDate) === key
}

function sumAmount(rows) {
  return (rows ?? []).reduce((s, r) => s + Number(r.amount || 0), 0)
}

/** @param {object[]} spoils */
export function buildReceivedFromSpoils(spoils, clientById) {
  return (spoils ?? []).map((row) => ({
    id: `spoil-${row.id}`,
    sourceType: 'battle_spoil',
    amount: Number(row.amount || 0),
    receivedAt: row.recorded_at || row.created_at,
    clientId: row.client_id,
    clientName: clientById[row.client_id] ?? 'Raid',
    label: row.ritual_name || 'Spoil',
    battleId: row.battle_id,
  }))
}

/** @param {object[]} accruals — joined with stream */
export function buildReceivedFromTributes(accruals, clientById) {
  return (accruals ?? [])
    .filter((row) => row.claimed_at)
    .map((row) => {
      const stream = row.stream ?? {}
      const clientId = stream.client_id
      const period = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`
      return {
        id: `tribute-${row.id}`,
        sourceType: 'tribute',
        amount: Number(row.amount || 0),
        receivedAt: row.claimed_at,
        clientId,
        clientName: clientById[clientId] ?? stream.client?.name ?? 'Raid',
        label: stream.ritual_name || 'Tribute',
        period,
      }
    })
}

export function buildReceivedLedger(spoils, claimedAccruals, clients) {
  const clientById = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]))
  const rows = [
    ...buildReceivedFromSpoils(spoils, clientById),
    ...buildReceivedFromTributes(claimedAccruals, clientById),
  ]
  return rows.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
}

export function buildOutstandingEntries(battles, openAccruals, clientById) {
  const items = []

  for (const battle of battles ?? []) {
    if (battle.status !== RAID_BATTLE_STATUS.AWAITING_SPOIL) continue
    items.push({
      id: `battle-${battle.id}`,
      sourceType: 'battle_spoil_pending',
      amount: null,
      clientId: battle.client_id,
      clientName: clientById[battle.client_id] ?? battle.client?.name ?? 'Raid',
      label: battle.battle_name,
      raidId: battle.client_id,
      battleId: battle.id,
      dueAt: battle.delivered_at,
    })
  }

  for (const row of openAccruals ?? []) {
    if (row.claimed_at) continue
    if (!isClaimable(row.ready_at)) continue
    const stream = row.stream ?? {}
    const clientId = stream.client_id
    items.push({
      id: `accrual-${row.id}`,
      sourceType: 'tribute_ready',
      amount: Number(row.amount || 0),
      clientId,
      clientName: clientById[clientId] ?? stream.client?.name ?? 'Raid',
      label: stream.ritual_name || 'Tribute',
      period: `${row.period_year}-${String(row.period_month).padStart(2, '0')}`,
      raidId: clientId,
      accrualId: row.id,
      dueAt: row.ready_at,
    })
  }

  return items
}

export function getTreasuryLedgerSummary({ received, outstanding, expenses, revenueTargetMonthly }) {
  const now = new Date()
  const thisMonthKey = monthKey(now)

  const receivedLifetime = sumAmount(received)
  const receivedThisMonth = sumAmount(received.filter((r) => isInMonth(r.receivedAt, thisMonthKey)))

  const outstandingTributeTotal = sumAmount(outstanding.filter((o) => o.sourceType === 'tribute_ready'))
  const outstandingBattleCount = outstanding.filter((o) => o.sourceType === 'battle_spoil_pending').length

  const expensesThisMonth = sumAmount(
    (expenses ?? []).filter((e) => isInMonth(e.date, thisMonthKey)),
  )
  const expensesLifetime = sumAmount(expenses)

  const revenueTarget = Number(revenueTargetMonthly || 0)
  const revenueProgress =
    revenueTarget > 0 ? Math.min(100, Math.round((receivedThisMonth / revenueTarget) * 100)) : 0

  return {
    receivedLifetime,
    receivedThisMonth,
    outstandingTributeTotal,
    outstandingBattleCount,
    outstandingCount: outstanding.length,
    expensesThisMonth,
    expensesLifetime,
    netThisMonth: receivedThisMonth - expensesThisMonth,
    revenueTarget,
    revenueProgress,
    thisMonthKey,
  }
}

export function groupReceivedByMonth(received) {
  const groups = {}
  for (const row of received) {
    const key = monthKey(row.receivedAt) ?? 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(row)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}
