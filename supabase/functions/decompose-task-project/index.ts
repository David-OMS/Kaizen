import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { isCronOrServiceRequest } from '../_shared/cronAuth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

type Phase = { index: number; title: string; contextNote: string; status: string }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fallbackPhases(title: string, context: string): Phase[] {
  const chunks = context.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  if (chunks.length >= 2) {
    return chunks.slice(0, 7).map((line, i) => ({
      index: i,
      title: line.slice(0, 80),
      contextNote: line,
      status: 'pending',
    }))
  }
  return [
    { index: 0, title: `${title} — foundation`, contextNote: context || 'Setup and scaffolding.', status: 'pending' },
    { index: 1, title: `${title} — core build`, contextNote: 'Main feature implementation.', status: 'pending' },
    { index: 2, title: `${title} — polish and ship`, contextNote: 'Review, fix, deploy or deliver.', status: 'pending' },
  ]
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

  const title = String(body.title ?? '').trim()
  const context = String(body.context ?? '').trim()
  const completedPhases = Array.isArray(body.completedPhases) ? body.completedPhases : []
  const additionalContext = String(body.additionalContext ?? '').trim()

  if (!title) return json({ error: 'title required' }, 400)

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    const phases = fallbackPhases(title, [context, additionalContext].filter(Boolean).join('\n'))
    return json({ phases, fallbackUsed: true, questKind: 'execution' })
  }

  const prompt = `Break this work into sequential daily execution phases (1 day of focused work each).
Return JSON only: { "questKind": "execution"|"learning", "phases": [ { "index": 0, "title": string, "contextNote": string } ] }
Rules:
- 2-10 phases max; each phase is one day's assignable quest
- execution for builds, outreach, research, admin; learning ONLY if study/course/reading is the main work
- research/find contacts/map prospects = execution, NOT learning
- Preserve completed phases exactly (do not rewrite them)
- Only plan remaining work for pending phases
- Order phases so dependencies come first

Project title: ${JSON.stringify(title)}
Full context: ${JSON.stringify(context)}
Additional context: ${JSON.stringify(additionalContext)}
Already completed phases: ${JSON.stringify(completedPhases)}`

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
    if (!res.ok) throw new Error('openai')
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    const parsed = text ? JSON.parse(text) : {}
    const rawPhases = Array.isArray(parsed.phases) ? parsed.phases : []
    const merged = [
      ...completedPhases.map((p: Record<string, unknown>, i: number) => ({
        index: Number(p.index ?? i),
        title: String(p.title ?? `Phase ${i + 1}`),
        contextNote: String(p.contextNote ?? ''),
        status: 'completed',
      })),
      ...rawPhases
        .filter((p: Record<string, unknown>) => String(p.status ?? 'pending') !== 'completed')
        .map((p: Record<string, unknown>, i: number) => ({
          index: completedPhases.length + i,
          title: String(p.title ?? `Phase ${completedPhases.length + i + 1}`).slice(0, 120),
          contextNote: String(p.contextNote ?? '').slice(0, 800),
          status: 'pending',
        })),
    ]
    const phases = merged.length ? merged : fallbackPhases(title, context)
    const questKind = parsed.questKind === 'learning' ? 'learning' : 'execution'
    return json({ phases, questKind, fallbackUsed: false })
  } catch {
    return json({
      phases: fallbackPhases(title, [context, additionalContext].filter(Boolean).join('\n')),
      questKind: 'execution',
      fallbackUsed: true,
    })
  }
})
