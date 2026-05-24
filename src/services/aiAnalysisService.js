import { AI_EDGE_FUNCTIONS } from '@/constants/aiAnalysis'
import { supabase } from '@/services/supabase'
import { updateRaidAnalysisFields } from '@/services/clientService'
import { updateQuestAnalysisFields } from '@/services/questService'
import { sha256Hex } from '@/utils/contentHash'

function buildSnapshot(analysis, model, fallbackUsed, contentHash) {
  return {
    ...analysis,
    model,
    fallback_used: fallbackUsed,
    content_hash: contentHash,
    analyzed_at: new Date().toISOString(),
  }
}

export async function invokeAnalyzeQuest({ title, context }) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.ANALYZE_QUEST, {
    body: { title, context: context ?? '' },
  })
  if (error) throw error
  if (!data?.analysis) throw new Error(data?.error || 'Quest analysis failed')
  return data
}

export async function invokeAnalyzeRaid({ title, description, scopeHints }) {
  const { data, error } = await supabase.functions.invoke(AI_EDGE_FUNCTIONS.ANALYZE_RAID, {
    body: {
      title,
      description: description ?? '',
      scopeHints: scopeHints ?? '',
    },
  })
  if (error) throw error
  if (!data?.analysis) throw new Error(data?.error || 'Raid analysis failed')
  return data
}

export async function analyzeAndPersistQuest(questId, { title, context }, existingSnapshot) {
  const hashInput = `${String(title).trim()}|${String(context ?? '').trim()}`
  const contentHash = await sha256Hex(hashInput)
  if (existingSnapshot?.content_hash === contentHash) {
    return { skipped: true, contentHash }
  }

  const raw = await invokeAnalyzeQuest({ title, context })
  const snapshot = buildSnapshot(raw.analysis, raw.model, raw.fallbackUsed, raw.contentHash ?? contentHash)

  const row = await updateQuestAnalysisFields(questId, {
    difficulty: raw.analysis.difficulty,
    fearLevel: raw.analysis.fearLevel,
    analysisSnapshot: snapshot,
  })
  return { skipped: false, quest: row, snapshot }
}

export async function analyzeAndPersistRaid(clientId, { title, description, scopeHints }, existingSnapshot) {
  const hashInput = `${String(title).trim()}|${String(description ?? '').trim()}|${String(scopeHints ?? '').trim()}`
  const contentHash = await sha256Hex(hashInput)
  if (existingSnapshot?.content_hash === contentHash) {
    return { skipped: true, contentHash }
  }

  const raw = await invokeAnalyzeRaid({ title, description, scopeHints })
  const snapshot = buildSnapshot(raw.analysis, raw.model, raw.fallbackUsed, raw.contentHash ?? contentHash)

  const row = await updateRaidAnalysisFields(clientId, {
    difficultyScore: raw.analysis.difficultyScore,
    raidRank: raw.analysis.rank,
    analysisSnapshot: snapshot,
  })
  return { skipped: false, client: row, snapshot }
}
