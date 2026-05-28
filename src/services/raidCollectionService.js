import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { TREASURY_COLLECTION_PERIOD_STATUS } from '@/constants/treasuryCollectionStatuses'
import { attachPeriodTotals } from '@/utils/treasuryCollectionPeriod'

export async function fetchRaidCollectionPanel(clientId) {
  const userId = await getAuthenticatedUserId()

  const periodsRes = await supabase
    .from('treasury_collection_periods')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .order('start_year', { ascending: false })
    .order('start_month', { ascending: false })

  if (periodsRes.error) throw periodsRes.error

  const periodIds = (periodsRes.data ?? []).map((p) => p.id)
  let entries = []
  if (periodIds.length > 0) {
    const entriesRes = await supabase
      .from('treasury_collection_entries')
      .select('*')
      .eq('user_id', userId)
      .in('period_id', periodIds)
      .order('created_at', { ascending: false })
    if (entriesRes.error) throw entriesRes.error
    entries = entriesRes.data ?? []
  }
  const periods = (periodsRes.data ?? []).map((p) => attachPeriodTotals(p, entries))
  const activePeriod = periods.find((p) => p.status === TREASURY_COLLECTION_PERIOD_STATUS.ACTIVE) ?? null
  const completedPeriods = periods.filter((p) => p.status === TREASURY_COLLECTION_PERIOD_STATUS.COMPLETED)

  return { activePeriod, completedPeriods, entries }
}

export async function sumCollectionEntriesNgn() {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('treasury_collection_entries')
    .select('amount')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
}

export async function createRaidCollectionPeriod({ clientId, title, startMonth, startYear, endMonth, endYear }) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('treasury_collection_periods')
    .insert({
      user_id: userId,
      client_id: clientId,
      title: title?.trim() || 'Exam period',
      start_month: startMonth,
      start_year: startYear,
      end_month: endMonth ?? null,
      end_year: endYear ?? null,
      status: TREASURY_COLLECTION_PERIOD_STATUS.ACTIVE,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function completeRaidCollectionPeriod(periodId, payload = {}) {
  const userId = await getAuthenticatedUserId()
  const patch = {
    status: TREASURY_COLLECTION_PERIOD_STATUS.COMPLETED,
    completed_at: new Date().toISOString(),
  }

  if (payload.endMonth != null && payload.endYear != null) {
    patch.end_month = payload.endMonth
    patch.end_year = payload.endYear
  }

  const { data, error } = await supabase
    .from('treasury_collection_periods')
    .update(patch)
    .eq('id', periodId)
    .eq('user_id', userId)
    .eq('status', TREASURY_COLLECTION_PERIOD_STATUS.ACTIVE)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function addRaidCollectionEntry({ periodId, amount, note }) {
  const userId = await getAuthenticatedUserId()
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) throw new Error('Amount must be greater than zero')

  const { data: period, error: pe } = await supabase
    .from('treasury_collection_periods')
    .select('id, status, client_id')
    .eq('id', periodId)
    .eq('user_id', userId)
    .single()

  if (pe) throw pe
  if (period?.status !== TREASURY_COLLECTION_PERIOD_STATUS.ACTIVE) {
    throw new Error('This period is closed. Open a new exam period on this raid to add money.')
  }

  const { data, error } = await supabase
    .from('treasury_collection_entries')
    .insert({
      user_id: userId,
      period_id: periodId,
      amount: n,
      note: note?.trim() || '',
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}
