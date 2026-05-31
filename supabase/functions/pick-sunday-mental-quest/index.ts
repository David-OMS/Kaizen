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

function fallback() {
  return {
    title: 'Sunday journal — what are you avoiding?',
    journalPrompt:
      'Write for 10–15 minutes about something you keep putting off that connects to your current goals. Be specific: what is it, why does it matter, and what is one honest reason you have not moved on it yet?',
  }
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

  const hunterVision = String(body.hunterVision ?? '')
  const hunterGoals = String(body.hunterGoals ?? '')
  const key = Deno.env.get('OPENAI_API_KEY')

  if (!key) return json(fallback())

  const prompt = `You write ONE Sunday mental-readiness journal prompt for a solo founder using a productivity RPG app.

Purpose: help them uncover honest thoughts, resistance, fears, or blind spots tied to their goals — mental prep for the week ahead. NOT a todo list. NOT week planning. NOT tasks.

Rules:
- Plain, direct English. No jargon unless you explain it in the same sentence.
- Never use vague labels like "operator vs passenger" without explaining what you mean.
- journalPrompt: 2–4 sentences. Tell them exactly what to write about for 10–15 minutes. Should feel like a therapist-coach nudge tied to their vision/goals.
- title: short card title (max 12 words), starts with "Sunday journal" or "Sunday reflection"
- One prompt only. Personalize using hunter context below.

Hunter vision: ${hunterVision}
Current goals: ${hunterGoals}

Return JSON only: { "title": string, "journalPrompt": string }`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.88,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Compact JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return json(fallback())
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    const parsed = text ? JSON.parse(text) : {}
    return json({
      title: String(parsed.title || fallback().title).slice(0, 120),
      journalPrompt: String(parsed.journalPrompt || fallback().journalPrompt).slice(0, 600),
    })
  } catch {
    return json(fallback())
  }
})
