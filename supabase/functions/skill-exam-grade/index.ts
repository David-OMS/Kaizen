import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { createUserSupabase } from '../_shared/supabaseFromRequest.ts'
import { createServiceSupabase } from '../_shared/supabaseAdmin.ts'
import { clampVerificationGrade, FALLBACK_GRADE } from '../_shared/verificationClamp.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
const THRESHOLD = Math.min(100, Math.max(50, Number(Deno.env.get('SKILL_VERIFICATION_PASS_THRESHOLD') || '70')))

type Q = { id: string; prompt: string }

async function callGradeOpenAi(skillLabel: string, bundle: string): Promise<{ parsed: Record<string, unknown>; ok: true } | { ok: false }> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { ok: false }

  const userMsg = `Skill: ${JSON.stringify(skillLabel)}.
Evaluate the learner answers. Data (JSON): ${bundle}
Return JSON only: { "score": 0-100 integer holistic mastery, "rationale": "one sentence under 200 chars" }
Be strict but fair; empty or nonsense answers score under ${THRESHOLD}.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
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

function normalizeQuestions(raw: unknown): Q[] {
  if (!Array.isArray(raw)) return []
  const out: Q[] = []
  for (const o of raw) {
    if (!o || typeof o !== 'object') continue
    const id = String((o as { id?: unknown }).id || '').trim().slice(0, 32)
    const prompt = String((o as { prompt?: unknown }).prompt || '').trim().slice(0, 500)
    if (!id || !prompt) continue
    out.push({ id, prompt })
  }
  return out
}

function normalizeAnswers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((a) => String(a ?? '').trim().slice(0, 2000))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { user, error } = await requireUser(req)
  if (!user) return json({ error: error ?? 'Unauthorized' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { arcId?: string; questions?: unknown; answers?: unknown }
  try {
    body = (await req.json()) as { arcId?: string; questions?: unknown; answers?: unknown }
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const arcId = typeof body.arcId === 'string' ? body.arcId.trim() : ''
  if (!arcId) return json({ error: 'arcId is required' }, 400)

  const questions = normalizeQuestions(body.questions)
  const answers = normalizeAnswers(body.answers)
  if (!questions.length || questions.length !== answers.length) {
    return json({ error: 'questions and answers must be same-length non-empty arrays.' }, 400)
  }
  if (answers.some((a) => !a)) return json({ error: 'Each answer must be non-empty.' }, 400)

  const sb = createUserSupabase(req)
  if (!sb) return json({ error: 'Unauthorized' }, 401)

  const { data: arc, error: arcErr } = await sb.from('skill_arcs').select('*').eq('id', arcId).eq('user_id', user.id).single()
  if (arcErr || !arc) return json({ error: 'Arc not found.' }, 404)
  if (arc.status !== 'verification') return json({ error: 'Arc must be in verification.' }, 400)

  let skillLabel = arc.proposed_skill_name || 'Domain skill'
  if (arc.skill_id) {
    const { data: sk } = await sb.from('skills').select('name').eq('id', arc.skill_id).single()
    if (sk?.name) skillLabel = String(sk.name)
  }

  const admin = createServiceSupabase()
  if (!admin) {
    return json(
      {
        error:
          'Server missing SUPABASE_SERVICE_ROLE_KEY for verification grading. Add it in Edge Function secrets.',
      },
      503,
    )
  }

  const bundle = JSON.stringify(
    questions.map((q, i) => ({ id: q.id, prompt: q.prompt, answer: answers[i] })),
  )

  const ai = await callGradeOpenAi(skillLabel, bundle)
  let result = FALLBACK_GRADE
  if (ai.ok) {
    try {
      result = clampVerificationGrade(ai.parsed, THRESHOLD)
    } catch {
      result = FALLBACK_GRADE
    }
  }

  const { error: insErr } = await admin.from('skill_verification_grades').insert({
    user_id: user.id,
    arc_id: arcId,
    score: result.score,
    passed: result.passed,
  })
  if (insErr) return json({ error: insErr.message }, 500)

  return json({
    score: result.score,
    passed: result.passed,
    rationale: result.rationale,
    passThreshold: THRESHOLD,
    model: MODEL,
  })
})
