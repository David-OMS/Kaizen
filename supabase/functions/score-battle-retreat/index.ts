import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import {
  clampRetreatScore,
  FALLBACK_RETREAT,
  type RetreatScore,
} from '../_shared/clampRetreatScore.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
const MAX_XP = 80

function buildPrompt(body: {
  battleName: string
  scopeNote: string
  retreatNote: string
  clientDirective: string
  startedAt: string
  dueDate: string
}) {
  return `You score a RETREATED raid battle in a solo-levelling founder CRM.
The hunter failed or abandoned this battle chunk — no payment. Award experience XP for effort and learning only.

Rules:
- xpAward: integer 0–${MAX_XP}. Zero if client skipped before real work or trivial effort.
- Higher XP for sustained effort, technical learning, painful failures that built capability.
- Lower/zero if client directive was "skip", or work was <1 day with no substance.
- systemMessage: max 180 chars, ominous System voice, second person.
- effortTier: one of "none" | "light" | "moderate" | "heavy" | "brutal"

Battle: ${JSON.stringify(body.battleName)}
Scope: ${JSON.stringify(body.scopeNote)}
Started: ${body.startedAt}
Due (optional): ${body.dueDate || 'none'}
Retreat debrief: ${JSON.stringify(body.retreatNote)}
Client directive (optional): ${JSON.stringify(body.clientDirective || 'none')}

Return ONLY JSON: { "xpAward": number, "systemMessage": string, "effortTier": string }`
}

async function callOpenAi(body: Parameters<typeof buildPrompt>[0]) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { ok: false as const }

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
        { role: 'system', content: 'Compact JSON only.' },
        { role: 'user', content: buildPrompt(body) },
      ],
    }),
  })

  if (!res.ok) return { ok: false as const }
  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = payload.choices?.[0]?.message?.content
  if (!text) return { ok: false as const }
  try {
    return { ok: true as const, parsed: JSON.parse(text) as Record<string, unknown> }
  } catch {
    return { ok: false as const }
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

  let body: {
    battleName?: string
    scopeNote?: string
    retreatNote?: string
    clientDirective?: string
    startedAt?: string
    dueDate?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const battleName = typeof body.battleName === 'string' ? body.battleName.trim() : ''
  const retreatNote = typeof body.retreatNote === 'string' ? body.retreatNote.trim() : ''
  if (!battleName || !retreatNote) return json({ error: 'battleName and retreatNote required' }, 400)

  const input = {
    battleName,
    scopeNote: typeof body.scopeNote === 'string' ? body.scopeNote.trim() : '',
    retreatNote,
    clientDirective: typeof body.clientDirective === 'string' ? body.clientDirective.trim() : '',
    startedAt: typeof body.startedAt === 'string' ? body.startedAt.trim() : '',
    dueDate: typeof body.dueDate === 'string' ? body.dueDate.trim() : '',
  }

  const ai = await callOpenAi(input)
  let score: RetreatScore
  let fallbackUsed = true

  if (ai.ok) {
    try {
      score = clampRetreatScore(ai.parsed, MAX_XP)
      fallbackUsed = false
    } catch {
      score = { ...FALLBACK_RETREAT }
    }
  } else {
    score = { ...FALLBACK_RETREAT }
  }

  return json({ score, model: MODEL, fallbackUsed })
})
