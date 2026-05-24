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

  const prompt = `You assign daily solo-operator quests. Return JSON: { "suggestions": [ { "title": string, "difficulty": "easy"|"medium"|"hard"|"legendary", "questKind": "execution"|"learning", "category": string, "loadPoints": number, "taskPoolId": string|null, "context": string } ] }
Rules: total loadPoints MUST NOT exceed ${remaining}. Prefer ~1-3 tasks. Use hunter vision, skills, pool. Only invent tasks that fit remaining budget. Pool items optional.

Hunter: ${JSON.stringify(body.hunterVision ?? '')}
Skills: ${JSON.stringify(body.skills ?? [])}
Pool: ${JSON.stringify(body.pool ?? [])}
Carryovers already assigned: ${JSON.stringify(body.carryovers ?? [])}`

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
