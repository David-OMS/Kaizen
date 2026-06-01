import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { isCronOrServiceRequest } from '../_shared/cronAuth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!(await isCronOrServiceRequest(req))) {
    const { user, error } = await requireUser(req)
    if (!user) return json({ error: error ?? 'Unauthorized' }, 401)
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const remaining = Number(body.remainingBudget ?? 0)
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key || remaining < 1) return json({ suggestions: [] })

  const mode = String(body.mode ?? 'pack')
  const isExtra = mode === 'extra_single'
  const tier = String(body.remainderTier ?? '')
  const localHour = body.localHour != null ? Number(body.localHour) : null
  const hoursLeft = body.hoursUntilMidnight != null ? Number(body.hoursUntilMidnight) : null
  const remainderHint = String(body.remainderHint ?? '')

  const packRules = `Rules: total loadPoints MUST NOT exceed ${remaining}. Prefer ~1-3 tasks. Align with hunter profile (vision + current goals), skills, and pool. Only invent tasks that fit remaining budget. Pool items optional.`
  const extraRules = `MODE: extra_single — hunter finished main dailies and wants ONE more task for what's left today.
Rules: return exactly 1 suggestion in the array. loadPoints MUST NOT exceed ${remaining}. difficulty must fit remainder tier "${tier}" (${remainderHint}).
Local hour: ${localHour ?? 'unknown'}; ~${hoursLeft ?? '?'} hours until midnight in hunter TZ.
Prefer an unassigned pool item (taskPoolId) if it fits; otherwise invent a concrete execution task from profile + skills — not generic motivation.
Do NOT duplicate titles already assigned today.`

  const prompt = `You assign daily solo-operator quests. Return JSON: { "suggestions": [ { "title": string, "difficulty": "easy"|"medium"|"hard"|"legendary", "questKind": "execution"|"learning", "category": string, "loadPoints": number, "taskPoolId": string|null, "context": string } ] }
${isExtra ? extraRules : packRules}

Hunter profile: ${JSON.stringify(body.hunterVision ?? '')}
Skills: ${JSON.stringify(body.skills ?? [])}
Pool (unassigned today): ${JSON.stringify(body.pool ?? [])}
Already assigned today: ${JSON.stringify(body.carryovers ?? [])}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Compact JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return json({ suggestions: [] })
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    const parsed = text ? JSON.parse(text) : { suggestions: [] }
    return json({ suggestions: parsed.suggestions ?? [] })
  } catch {
    return json({ suggestions: [] })
  }
})
