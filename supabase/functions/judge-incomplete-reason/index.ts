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

  let body: { questTitle?: string; reason?: string; streak?: number }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const reason = String(body.reason ?? '').trim()
  if (!reason) return json({ solid: false, extensionHours: 0, note: 'No reason provided.' })

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    return json({
      solid: reason.length >= 40,
      extensionHours: reason.length >= 40 ? 24 : 0,
      note: 'Fallback: length heuristic.',
      fallbackUsed: true,
    })
  }

  const prompt = `Judge if this incomplete-reason for a daily quest is solid enough to grant a 1-day extension without penalty.
Quest: ${JSON.stringify(body.questTitle ?? '')}
Reason: ${JSON.stringify(reason)}
Streak days: ${Number(body.streak ?? 0)}
Return JSON only: { "solid": boolean, "extensionHours": number (0 or 24), "note": string under 200 chars }`

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
      solid: Boolean(parsed.solid),
      extensionHours: Number(parsed.extensionHours) || 0,
      note: String(parsed.note ?? ''),
    })
  } catch {
    return json({ solid: false, extensionHours: 0, note: 'AI unavailable.', fallbackUsed: true })
  }
})
