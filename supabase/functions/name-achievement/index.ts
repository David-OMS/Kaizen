import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import {
  clampAchievementNaming,
  FALLBACK_ACHIEVEMENT,
  type AchievementNaming,
} from '../_shared/clampAchievementNaming.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function buildPrompt(body: {
  category: string
  triggerHint: string
  catalogKey: string
  variationSeed: string
}) {
  return `You name hidden achievements for a solo-levelling / dungeon-crawler founder CRM app.
The player just unlocked a milestone. Invent a fresh, cool DISPLAY TITLE and one-line TAGLINE.
Rules:
- Title: 2-6 words, title case, fantasy-system vibe (like Solo Leveling notifications).
- Tagline: max 160 chars, second-person or ominous System voice, relevant to the trigger.
- MUST match the trigger meaning and CATEGORY (hunt vs raid vs spoil vs profile are different domains).
- NEVER use "First Blood" unless category is raid and trigger is literally first client signed.
- NEVER reuse generic raid combat names for hunt/outreach milestones.
- Be creative; this unlock id is unique: ${body.variationSeed}
- Do NOT use the catalog key as the title. Do NOT explain rules.

Category: ${body.category}
Trigger (what happened): ${body.triggerHint}
Internal id (do not copy): ${body.catalogKey}

Return ONLY JSON: { "displayTitle": string, "displayTagline": string }`
}

async function callOpenAi(body: {
  category: string
  triggerHint: string
  catalogKey: string
  variationSeed: string
}) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { ok: false as const }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.92,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Compact JSON only. Vary word choice every request.' },
        { role: 'user', content: buildPrompt(body) },
      ],
    }),
  })

  if (!res.ok) return { ok: false as const }
  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = payload.choices?.[0]?.message?.content
  if (!text) return { ok: false as const }
  try {
    return { ok: true as const, parsed: JSON.parse(text) as Record<string, unknown> }
  } catch {
    return { ok: false as const }
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

  let body: {
    category?: string
    triggerHint?: string
    catalogKey?: string
    variationSeed?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const category = typeof body.category === 'string' ? body.category.trim() : 'system'
  const triggerHint = typeof body.triggerHint === 'string' ? body.triggerHint.trim() : ''
  const catalogKey = typeof body.catalogKey === 'string' ? body.catalogKey.trim() : 'unknown'
  const variationSeed =
    typeof body.variationSeed === 'string' && body.variationSeed.trim()
      ? body.variationSeed.trim()
      : crypto.randomUUID()

  if (!triggerHint) return json({ error: 'triggerHint is required' }, 400)

  const ai = await callOpenAi({ category, triggerHint, catalogKey, variationSeed })
  let naming: AchievementNaming
  let fallbackUsed = true

  if (ai.ok) {
    try {
      naming = clampAchievementNaming(ai.parsed)
      fallbackUsed = false
    } catch {
      naming = { ...FALLBACK_ACHIEVEMENT }
    }
  } else {
    naming = { ...FALLBACK_ACHIEVEMENT }
  }

  return json({ naming, model: MODEL, fallbackUsed, variationSeed })
})
