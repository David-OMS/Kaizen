import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { supabase } from '@/services/supabase'

export async function invokeNameRaidReward({ kind, amount, purpose, clientName }) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.NAME_RAID_REWARD, {
    body: {
      kind,
      amount,
      purpose,
      clientName: clientName ?? '',
    },
  })
  if (error) throw error
  if (!data?.naming) throw new Error(data?.error || 'Reward naming failed')
  return data
}
