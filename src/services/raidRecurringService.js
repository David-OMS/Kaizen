import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { invokeNameRaidReward } from '@/services/aiRewardNamingService'
import { XP_EVENT_TYPES } from '@/constants/xpEvents'
import { addXP } from '@/services/xpService'
import { getClaimXpForAmount } from '@/utils/moneyBandXp'
import { eachCalendarMonth, getLagosCalendarParts, isClaimable, readyAtForPeriod } from '@/utils/raidRecurringLagos'

function buildNamingSnapshot(raw) {
  return {
    ritual_name: raw.naming.ritualName,
    ritual_tagline: raw.naming.ritualTagline,
    model: raw.model,
    fallback_used: raw.fallbackUsed,
  }
}

export async function listRecurringStreams(clientId) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_recurring_streams')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listAccrualsForStream(streamId) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_recurring_accruals')
    .select('*')
    .eq('stream_id', streamId)
    .eq('user_id', userId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listAccrualsGroupedByStream(clientId) {
  const streams = await listRecurringStreams(clientId)
  const grouped = {}
  for (const s of streams) {
    grouped[s.id] = await listAccrualsForStream(s.id)
  }
  return grouped
}

export async function ensureAccrualsForStream(streamId) {
  const userId = await getAuthenticatedUserId()
  const { data: stream, error: se } = await supabase
    .from('raid_recurring_streams')
    .select('*')
    .eq('id', streamId)
    .eq('user_id', userId)
    .single()

  if (se) throw se
  if (!stream?.is_active) return { created: 0 }

  const now = getLagosCalendarParts()
  let created = 0

  for (const { year, month } of eachCalendarMonth(
    stream.first_period_year,
    stream.first_period_month,
    now.year,
    now.month,
  )) {
    const { data: existing } = await supabase
      .from('raid_recurring_accruals')
      .select('id')
      .eq('stream_id', streamId)
      .eq('period_year', year)
      .eq('period_month', month)
      .maybeSingle()

    if (existing) continue

    const { error: ie } = await supabase.from('raid_recurring_accruals').insert({
      user_id: userId,
      stream_id: streamId,
      period_year: year,
      period_month: month,
      amount: stream.amount,
      ready_at: readyAtForPeriod(year, month),
    })

    if (ie?.code === '23505') continue
    if (ie) throw ie
    created += 1
  }

  return { created }
}

export async function ensureAccrualsForClient(clientId) {
  const streams = await listRecurringStreams(clientId)
  let total = 0
  for (const s of streams) {
    const { created } = await ensureAccrualsForStream(s.id)
    total += created
  }
  return { created: total }
}

export async function createRecurringStream({
  clientId,
  amount,
  purposeUserText,
  firstPeriodYear,
  firstPeriodMonth,
}) {
  const userId = await getAuthenticatedUserId()
  const { data: client, error: ce } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single()

  if (ce) throw ce

  const raw = await invokeNameRaidReward({
    kind: 'recurring',
    amount: Number(amount),
    purpose: purposeUserText || 'Recurring raid payment',
    clientName: client?.name ?? '',
  })

  const namingSnapshot = buildNamingSnapshot(raw)

  const { data: stream, error } = await supabase
    .from('raid_recurring_streams')
    .insert({
      user_id: userId,
      client_id: clientId,
      amount,
      purpose_user_text: purposeUserText ?? '',
      ritual_name: raw.naming.ritualName,
      ritual_tagline: raw.naming.ritualTagline,
      naming_snapshot: namingSnapshot,
      first_period_year: firstPeriodYear,
      first_period_month: firstPeriodMonth,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) throw error

  await ensureAccrualsForStream(stream.id)
  return stream
}

export async function updateRecurringStreamAmount(streamId, amount) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('raid_recurring_streams')
    .update({ amount })
    .eq('id', streamId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function claimRecurringAccrual(accrualId) {
  const userId = await getAuthenticatedUserId()
  const { data: row, error: fe } = await supabase
    .from('raid_recurring_accruals')
    .select('*')
    .eq('id', accrualId)
    .eq('user_id', userId)
    .single()

  if (fe) throw fe
  if (row.claimed_at) throw new Error('Already claimed')
  if (!isClaimable(row.ready_at)) throw new Error('Not claimable yet')

  const { data: stream, error: ste } = await supabase
    .from('raid_recurring_streams')
    .select('ritual_name, client_id')
    .eq('id', row.stream_id)
    .eq('user_id', userId)
    .single()

  if (ste) throw ste

  const { data: client, error: cle } = await supabase
    .from('clients')
    .select('name')
    .eq('id', stream.client_id)
    .eq('user_id', userId)
    .single()

  if (cle) throw cle

  const { data: updated, error } = await supabase
    .from('raid_recurring_accruals')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', accrualId)
    .eq('user_id', userId)
    .is('claimed_at', null)
    .select('*')
    .single()

  if (error) throw error

  const ritual = stream?.ritual_name ?? 'Recurring spoil'
  const clientName = client?.name ?? 'Raid'
  const amt = Number(row.amount)

  const claimXp = getClaimXpForAmount(amt)
  if (claimXp > 0) {
    await addXP(
      claimXp,
      XP_EVENT_TYPES.RAID_RECURRING_CLAIM,
      `Claimed ${ritual} — ${clientName} (${row.period_year}-${String(row.period_month).padStart(2, '0')}) ${amt}`,
      {
        presentation: {
          kind: 'reward',
          alwaysShow: true,
          title: ritual,
          description: `Tribute for ${clientName} — ${row.period_year}-${String(row.period_month).padStart(2, '0')}`,
          category: 'spoil',
        },
      },
    )
  }

  return updated
}
