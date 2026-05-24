import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { sha256Hex } from '../_shared/hash.ts'
import { createUserSupabase } from '../_shared/supabaseFromRequest.ts'
import { readFreshAnalysisCache, writeAnalysisCache } from '../_shared/analysisCache.ts'
import { clampRaidAnalysis, FALLBACK_RAID, type RaidAnalysis } from '../_shared/clampAnalysis.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function buildPrompt(title: string, description: string, scopeHints: string) {
  return `Analyze this client "raid" (paid project). Return ONLY valid JSON with keys:
difficultyScore (0-100 integer),
rank (E|D|C|B|A|S) — objective PROJECT difficulty tier,
suggestedDurationMinutes (integer, 5-1440),
estimatedXPBase (integer 0-5000, gamification baseline only),
suggestedSkillImpact (object or null): primarySkill (string or null), secondarySkill (string or null).

You are grading OBJECTIVE PROJECT SCOPE from the briefing text — not how nervous the founder felt (that is hunt fear, ignore it).

Use the briefing as evidence. Thin briefing ("build an app", no modules) → lower score. Detailed module list → score from that evidence.

Illustrative anchors (not a lookup table — weigh everything in the briefing):
- E (0-15): TRIVIAL = one static page, logo swap, config change, or <1 day of work; no database, no roles, no ongoing ops.
- D (16-35): one small deliverable (landing + form, simple CRUD, 1-2 screens, single user type).
- C (36-55): real small-business system: several modules (e.g. sales + inventory + admin), one product, one client org.
- B (56-75): complex ops software: many modules, dashboards, multi-role users, integrations, OR a second product fork on same codebase (e.g. restaurant variant).
- A (76-90): platform-scale for a solo studio: many subsystems, high data complexity, reliability burden, long maintenance surface.
- S (91-100): rare: enterprise/compliance/mission-critical at national scale — do not assign S to a normal client PWA.

Calibration for solo-founder client work: a multi-module BMS (sales, supply, production, expenses, admin, analytics) plus a branded fork is typically B or A if the briefing lists those — not E or D.

Map difficultyScore consistently with rank. Do NOT output fearLevel.

Raid title: ${JSON.stringify(title)}
Objective: ${JSON.stringify(description)}
Briefing / scope: ${JSON.stringify(scopeHints)}`
}

async function callOpenAi(
  title: string,
  description: string,
  scopeHints: string,
): Promise<{ parsed: Record<string, unknown>; ok: true } | { ok: false }> {
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
        { role: 'user', content: buildPrompt(title, description, scopeHints) },
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

  let body: { title?: string; description?: string; scopeHints?: string }
  try {
    body = (await req.json()) as { title?: string; description?: string; scopeHints?: string }
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const scopeHints = typeof body.scopeHints === 'string' ? body.scopeHints.trim() : ''
  if (!title) return json({ error: 'title is required' }, 400)

  const contentHash = await sha256Hex(`${title}|${description}|${scopeHints}`)

  const sbUser = createUserSupabase(req)
  if (sbUser) {
    const cached = await readFreshAnalysisCache(sbUser, 'raid', contentHash)
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

  const ai = await callOpenAi(title, description, scopeHints)
  let analysis: RaidAnalysis
  let fallbackUsed = true
  if (ai.ok) {
    try {
      analysis = clampRaidAnalysis(ai.parsed)
      fallbackUsed = false
    } catch {
      analysis = { ...FALLBACK_RAID }
    }
  } else {
    analysis = { ...FALLBACK_RAID }
  }

  const responsePayload = { analysis, model: MODEL, fallbackUsed, contentHash }
  if (sbUser) {
    await writeAnalysisCache(sbUser, user.id, 'raid', contentHash, responsePayload, MODEL, fallbackUsed).catch(
      () => undefined,
    )
  }

  return json(responsePayload)
})
