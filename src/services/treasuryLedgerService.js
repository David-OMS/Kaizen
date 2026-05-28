import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import { RAID_BATTLE_STATUS } from '@/constants/raidBattleStatuses'
import { sumCollectionEntriesNgn } from '@/services/raidCollectionService'
import {
  buildOutstandingEntries,
  buildReceivedLedger,
} from '@/utils/treasuryLedger'

export async function fetchTreasuryLedger() {
  const userId = await getAuthenticatedUserId()

  const [
    spoilsRes,
    accrualsRes,
    battlesRes,
    clientsRes,
    expensesRes,
    collectionTotal,
  ] = await Promise.all([
    supabase
      .from('raid_spoils')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false }),
    supabase
      .from('raid_recurring_accruals')
      .select(
        `
        *,
        stream:raid_recurring_streams (
          ritual_name,
          client_id,
          client:clients ( name )
        )
      `,
      )
      .eq('user_id', userId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false }),
    supabase
      .from('raid_battles')
      .select('id, client_id, battle_name, status, delivered_at, client:clients ( name )')
      .eq('user_id', userId)
      .eq('status', RAID_BATTLE_STATUS.AWAITING_SPOIL),
    supabase.from('clients').select('id, name').eq('user_id', userId),
    supabase
      .from('treasury_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    sumCollectionEntriesNgn().catch(() => 0),
  ])

  if (spoilsRes.error) throw spoilsRes.error
  if (accrualsRes.error) throw accrualsRes.error
  if (battlesRes.error) throw battlesRes.error
  if (clientsRes.error) throw clientsRes.error
  if (expensesRes.error) throw expensesRes.error
  if (activePeriodRes.error) throw activePeriodRes.error
  if (collectionEntriesRes.error) throw collectionEntriesRes.error

  const clients = clientsRes.data ?? []
  const clientById = Object.fromEntries(clients.map((c) => [c.id, c.name]))
  const spoils = spoilsRes.data ?? []
  const accruals = accrualsRes.data ?? []

  const received = buildReceivedLedger(spoils, accruals, clients)
  const outstanding = buildOutstandingEntries(battlesRes.data, accruals, clientById)

  return {
    received,
    outstanding,
    expenses: expensesRes.data ?? [],
    clients,
    collectionReceivedLifetime: Number(collectionTotal) || 0,
  }
}
