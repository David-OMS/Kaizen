import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
const PASS = 70

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

  let body: { title?: string; questions?: unknown; answers?: unknown; xpReward?: number }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const key = Deno.env.get('OPENAI_API_KEY')
  const xpReward = Number(body.xpReward ?? 30)

  if (!key) {
    const pass = (body.answers as string[] | undefined)?.some((a) => String(a).length > 20)
    return json({
      pass: Boolean(pass),
      score: pass ? 75 : 40,
      partialXp: pass ? 0 : 0,
      rationale: 'Fallback grade.',
      fallbackUsed: true,
    })
  }

  const prompt = `Grade learning quest assessment. Return JSON: { "pass": boolean, "score": 0-100, "partialXp": number, "rationale": string }
pass if score >= ${PASS}. partialXp 0 to ${Math.round(xpReward * 0.5)} only if fail but showed effort.
Quest: ${JSON.stringify(body.title ?? '')}
Q&A: ${JSON.stringify({ questions: body.questions, answers: body.answers })}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Compact JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) throw new Error('openai')
    const data = await res.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return json({
      pass: Boolean(parsed.pass),
      score: Number(parsed.score) || 0,
      partialXp: Math.max(0, Number(parsed.partialXp) || 0),
      rationale: String(parsed.rationale ?? ''),
    })
  } catch {
    return json({ pass: false, score: 0, partialXp: 0, rationale: 'Grade failed.', fallbackUsed: true })
  }
})
