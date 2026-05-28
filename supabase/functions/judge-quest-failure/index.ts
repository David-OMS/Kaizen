import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

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
    questTitle?: string
    reason?: string
    xpReward?: number
    xpPenalty?: number
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const reason = String(body.reason ?? '').trim()
  const reward = Number(body.xpReward ?? 0)
  const penalty = Number(body.xpPenalty ?? 12)

  if (!reason) {
    return json({ attempted: false, xpDelta: -penalty, note: 'No reason provided.' })
  }

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    const attempted = reason.length >= 30
    return json({
      attempted,
      xpDelta: attempted ? Math.round(reward * 0.25) : -penalty,
      note: 'Fallback: length heuristic.',
      fallbackUsed: true,
    })
  }

  const prompt = `The hunter ATTEMPTED this quest but could NOT complete the objective (skill gap, blocker, tool failed). This is NOT "ran out of time" (that is incomplete/extension). NOT "never tried" (system expires those).

Quest: ${JSON.stringify(body.questTitle ?? '')}
What they tried and why it failed: ${JSON.stringify(reason)}
Max reward if worthy: ${reward}, typical penalty if hollow: -${penalty}

Return JSON only:
{
  "attempted": boolean,
  "xpDelta": integer (negative penalty up to -${penalty}, or 0, or partial positive up to ~${Math.round(reward * 0.5)} if effort was real),
  "note": string under 200 chars
}`

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
      attempted: Boolean(parsed.attempted),
      xpDelta: Number(parsed.xpDelta) || -penalty,
      note: String(parsed.note ?? ''),
    })
  } catch {
    return json({ attempted: false, xpDelta: -penalty, note: 'AI unavailable.', fallbackUsed: true })
  }
})
