import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { createUserSupabase } from '../_shared/supabaseFromRequest.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
const QN = Math.min(5, Math.max(3, Number(Deno.env.get('SKILL_EXAM_QUESTION_COUNT') || '4')))

type ExamQuestion = { id: string; prompt: string }

function clampQuestions(raw: unknown, max: number): ExamQuestion[] {
  if (!raw || typeof raw !== 'object') return []
  const qs = (raw as { questions?: unknown }).questions
  if (!Array.isArray(qs)) return []
  const out: ExamQuestion[] = []
  for (let i = 0; i < qs.length && out.length < max; i++) {
    const o = qs[i]
    if (!o || typeof o !== 'object') continue
    const id = String((o as { id?: unknown }).id || `q${out.length + 1}`).slice(0, 32)
    const prompt = String((o as { prompt?: unknown }).prompt || '').trim().slice(0, 500)
    if (!prompt) continue
    out.push({ id, prompt })
  }
  return out
}

function fallbackQuestions(skillLabel: string): ExamQuestion[] {
  return [
    {
      id: 'q1',
      prompt: `In one or two sentences, what does "${skillLabel}" mean for your solo business?`,
    },
    {
      id: 'q2',
      prompt: `Name one concrete deliverable or habit that proves you practice "${skillLabel}".`,
    },
    { id: 'q3', prompt: 'What is the biggest risk if you ignore this skill for 30 days?' },
  ]
}

async function callOpenAi(skillLabel: string, tier: string): Promise<{ parsed: Record<string, unknown>; ok: true } | { ok: false }> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { ok: false }

  const userMsg = `Skill focus: ${JSON.stringify(skillLabel)}. Curriculum tier context: ${JSON.stringify(tier)}.
Return JSON only: { "questions": [ { "id": "q1", "prompt": "short free-text question" }, ... ] }
Generate exactly ${QN} practical questions (no multiple choice). Each prompt under 220 characters.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output compact JSON only. No prose.' },
        { role: 'user', content: userMsg },
      ],
    }),
  })

  if (!res.ok) return { ok: false }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = body.choices?.[0]?.message?.content
  if (!text) return { ok: false }
  try {
    return { parsed: JSON.parse(text) as Record<string, unknown>, ok: true }
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

  let body: { arcId?: string }
  try {
    body = (await req.json()) as { arcId?: string }
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const arcId = typeof body.arcId === 'string' ? body.arcId.trim() : ''
  if (!arcId) return json({ error: 'arcId is required' }, 400)

  const sb = createUserSupabase(req)
  if (!sb) return json({ error: 'Unauthorized' }, 401)

  const { data: arc, error: arcErr } = await sb.from('skill_arcs').select('*').eq('id', arcId).eq('user_id', user.id).single()
  if (arcErr || !arc) return json({ error: 'Arc not found.' }, 404)
  if (arc.status !== 'verification') return json({ error: 'Arc must be in verification.' }, 400)

  let skillLabel = arc.proposed_skill_name || 'Domain skill'
  let tier = ''
  if (arc.skill_id) {
    const { data: sk } = await sb.from('skills').select('name, description, curriculum_tier').eq('id', arc.skill_id).single()
    if (sk?.name) skillLabel = String(sk.name)
    tier = [sk?.curriculum_tier, sk?.description].filter(Boolean).join(' · ').slice(0, 400)
  }

  const ai = await callOpenAi(skillLabel, tier || 'unspecified')
  let questions = ai.ok ? clampQuestions(ai.parsed, QN) : []
  let fallbackUsed = questions.length < 3
  if (fallbackUsed) {
    questions = fallbackQuestions(skillLabel)
  }

  return json({ questions, model: MODEL, fallbackUsed, skillLabel })
})
