import { analyzeAndPersistRaid } from '@/services/aiAnalysisService'

/** Runs Raid Analyzer on a newly created client; returns updated row when rank/score are set. */
export async function analyzeNewRaid(client) {
  if (!client?.id) return { client, analyzed: false }

  try {
    const result = await analyzeAndPersistRaid(
      client.id,
      {
        title: client.name,
        description: client.project_name || '',
        scopeHints: client.notes || '',
      },
      client.analysis_snapshot,
    )

    return {
      client: result.client ?? client,
      analyzed: !result.skipped,
      snapshot: result.snapshot,
    }
  } catch {
    return { client, analyzed: false }
  }
}
