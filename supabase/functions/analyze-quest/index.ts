import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { sha256Hex } from '../_shared/hash.ts'
import { createUserSupabase } from '../_shared/supabaseFromRequest.ts'
import { readFreshAnalysisCache, writeAnalysisCache } from '../_shared/analysisCache.ts'
import { clampQuestAnalysis, FALLBACK_QUEST, type QuestAnalysis } from '../_shared/clampAnalysis.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function buildPrompt(title: string, context: string) {
  return `Classify this solo-operator quest. Return ONLY valid JSON with keys:
difficulty (easy|medium|hard|legendary),
fearLevel (integer 1-5),
category (build|outreach|learning|admin),
skillImpact (object or null): primarySkill (string or null), secondarySkill (string or null), unlockCandidate (boolean),
confidence (number 0-1).

Quest title: ${JSON.stringify(title)}
Optional context: ${JSON.stringify(context)}`
}

async function callOpenAi(title: string, context: string): Promise<{ parsed: Record<string, unknown>; ok: true } | { ok: false }> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { ok: false }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output compact JSON only. No prose.' },
        { role: 'user', content: buildPrompt(title, context) },
      ],
    }),
  })

  if (!res.ok) return { ok: false }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = body.choices?.[0]?.message?.content
  if (!text) return { ok: false }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    return { parsed, ok: true }
  } catch {
    return { ok: false }
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { user, error } = await requireUser(req)
  if (!user) return json({ error: error ?? 'Unauthorized' }, 401)

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { title?: string; context?: string }
  try {
    body = (await req.json()) as { title?: string; context?: string }
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const context = typeof body.context === 'string' ? body.context.trim() : ''
  if (!title) return json({ error: 'title is required' }, 400)

  const contentHash = await sha256Hex(`${title}|${context}`)

  const sbUser = createUserSupabase(req)
  if (sbUser) {
    const cached = await readFreshAnalysisCache(sbUser, 'quest', contentHash)
    if (cached?.analysis) {
      return json({
        analysis: cached.analysis,
        model: cached.model,
        fallbackUsed: cached.fallbackUsed,
        contentHash: cached.contentHash,
        cached: true,
      })
    }
  }

  const ai = await callOpenAi(title, context)
  let analysis: QuestAnalysis
  let fallbackUsed = true
  if (ai.ok) {
    try {
      analysis = clampQuestAnalysis(ai.parsed)
      fallbackUsed = false
    } catch {
      analysis = { ...FALLBACK_QUEST }
    }
  } else {
    analysis = { ...FALLBACK_QUEST }
  }

  const responsePayload = { analysis, model: MODEL, fallbackUsed, contentHash }
  if (sbUser) {
    await writeAnalysisCache(sbUser, user.id, 'quest', contentHash, responsePayload, MODEL, fallbackUsed).catch(
      () => undefined,
    )
  }

  return json(responsePayload)
})
