const TTL_MS = 24 * 60 * 60 * 1000

type CachePayload = {
  analysis: unknown
  model: string
  fallbackUsed: boolean
  contentHash: string
}

// deno-lint-ignore no-explicit-any
export async function readFreshAnalysisCache(sb: any, kind: 'quest' | 'raid', contentHash: string): Promise<CachePayload | null> {
  const { data, error } = await sb
    .from('ai_analysis_cache')
    .select('payload, created_at')
    .eq('kind', kind)
    .eq('content_hash', contentHash)
    .maybeSingle()

  if (error || !data?.payload) return null
  const created = new Date(data.created_at).getTime()
  if (Date.now() - created > TTL_MS) return null

  const p = data.payload as Record<string, unknown>
  if (!p || typeof p !== 'object') return null
  return {
    analysis: p.analysis,
    model: String(p.model ?? ''),
    fallbackUsed: Boolean(p.fallbackUsed),
    contentHash: String(p.contentHash ?? contentHash),
  }
}

// deno-lint-ignore no-explicit-any
export async function writeAnalysisCache(
  sb: any,
  userId: string,
  kind: 'quest' | 'raid',
  contentHash: string,
  payload: CachePayload,
  model: string,
  fallbackUsed: boolean,
): Promise<void> {
  await sb.from('ai_analysis_cache').upsert(
    {
      user_id: userId,
      kind,
      content_hash: contentHash,
      payload: payload as unknown as Record<string, unknown>,
      model,
      fallback_used: fallbackUsed,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,kind,content_hash' },
  )
}
