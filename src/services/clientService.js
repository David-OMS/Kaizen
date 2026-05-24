import { getAuthenticatedUserId, supabase } from '@/services/supabase'
import {
  mapDbStatusToRaidUi,
  mapRaidUiStatusToDb,
  normalizeRaidRank,
  RAID_DB_ONGOING_STATUSES,
} from '@/constants/fieldOptions'

export async function getActiveClientCount() {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .in('status', RAID_DB_ONGOING_STATUSES)

  if (error) throw error
  return count ?? 0
}

function mapClientRow(client) {
  return {
    ...client,
    raid_status: mapDbStatusToRaidUi(client.status),
    raid_rank: normalizeRaidRank(client.raid_rank),
  }
}

export async function getClientById(clientId) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single()
  if (error) throw error
  return mapClientRow(data)
}

export async function getClients(status) {
  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    const dbStatus = mapRaidUiStatusToDb(status)
    if (status === 'pending') {
      query = query.in('status', ['pending', 'proposal'])
    } else {
      query = query.eq('status', dbStatus)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapClientRow)
}

export async function createClient(payload) {
  const userId = await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: payload.name,
      project_name: payload.projectName,
      status: mapRaidUiStatusToDb(payload.status),
      start_date: payload.startDate || null,
      contract_value: payload.contractValue || null,
      referral_source: payload.referralSource || null,
      raid_rank: normalizeRaidRank(payload.raidRank),
      notes: payload.notes || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapClientRow(data)
}

export async function updateClient(payload) {
  const { data, error } = await supabase
    .from('clients')
    .update({
      name: payload.name,
      project_name: payload.projectName,
      status: mapRaidUiStatusToDb(payload.status),
      start_date: payload.startDate || null,
      contract_value: payload.contractValue || null,
      referral_source: payload.referralSource || null,
      raid_rank: normalizeRaidRank(payload.raidRank),
      notes: payload.notes || null,
    })
    .eq('id', payload.id)
    .select('*')
    .single()

  if (error) throw error
  return mapClientRow(data)
}

export async function updateRaidAnalysisFields(clientId, { difficultyScore, raidRank, analysisSnapshot }) {
  const patch = {}
  if (difficultyScore != null) {
    patch.difficulty_score = difficultyScore
  }
  if (raidRank != null) {
    patch.raid_rank = normalizeRaidRank(raidRank)
  }
  if (analysisSnapshot != null) {
    patch.analysis_snapshot = analysisSnapshot
  }

  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', clientId)
    .select('*')
    .single()

  if (error) throw error
  return mapClientRow(data)
}