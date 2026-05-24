import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fallback(title: string) {
  return {
    questions: [
      { id: 'q1', prompt: `What is the core idea behind "${title}"?` },
      { id: 'q2', prompt: `Name one thing you applied today for "${title}".` },
      { id: 'q3', prompt: 'What would you do differently next session?' },
    ],
    fallbackUsed: true,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const { user, error } = await requireUser(req)
  if (!user) return json({ error: error ?? 'Unauthorized' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { title?: string; context?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const title = String(body.title ?? 'Learning quest').trim()
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return json(fallback(title))

  const prompt = `Create 3 short assessment questions for a learning daily quest.
Title: ${JSON.stringify(title)}
Context: ${JSON.stringify(body.context ?? '')}
Return JSON: { "questions": [ { "id": "q1", "prompt": string } ] } max 4 questions, prompts under 300 chars.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Compact JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return json(fallback(title))
    const data = await res.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return json({ questions: parsed.questions ?? fallback(title).questions })
  } catch {
    return json(fallback(title))
  }
})
