import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { clampRaidRewardNaming, FALLBACK_RAID_REWARD, type RaidRewardNaming } from '../_shared/clampRaidRewardNaming.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

function buildPrompt(kind: 'recurring' | 'one_off', amount: number, purpose: string, clientName: string) {
  const k =
    kind === 'recurring'
      ? 'This is a MONTHLY recurring payment stream for the same raid (same ritual name every month).'
      : 'This is a ONE-TIME payment (loot drop) for a completed chunk of work.'
  return `${k}
Return ONLY valid JSON with keys:
ritualName (string, 2-48 chars, title case, fantasy / dungeon / solo-levelling vibe, NOT cringe slurs),
ritualTagline (string, max 160 chars, one punchy line that fits the payment purpose).

Amount (number, local currency): ${amount}
Client / raid: ${JSON.stringify(clientName)}
Purpose / what this pays for: ${JSON.stringify(purpose)}`
}

async function callOpenAi(kind: 'recurring' | 'one_off', amount: number, purpose: string, clientName: string) {
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
      temperature: 0.45,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output compact JSON only. No prose.' },
        { role: 'user', content: buildPrompt(kind, amount, purpose, clientName) },
      ],
    }),
  })

  if (!res.ok) return { ok: false as const }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = body.choices?.[0]?.message?.content
  if (!text) return { ok: false as const }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    return { ok: true as const, parsed }
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
    kind?: string
    amount?: number
    purpose?: string
    clientName?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const kind = body.kind === 'one_off' ? 'one_off' : 'recurring'
  const amount = typeof body.amount === 'number' && Number.isFinite(body.amount) ? body.amount : NaN
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : ''
  const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : ''

  if (!Number.isFinite(amount) || amount < 0) return json({ error: 'amount is required' }, 400)
  if (!purpose) return json({ error: 'purpose is required' }, 400)

  const ai = await callOpenAi(kind, amount, purpose, clientName || 'Raid')
  let naming: RaidRewardNaming
  let fallbackUsed = true
  if (ai.ok) {
    try {
      naming = clampRaidRewardNaming(ai.parsed)
      fallbackUsed = false
    } catch {
      naming = { ...FALLBACK_RAID_REWARD }
    }
  } else {
    naming = { ...FALLBACK_RAID_REWARD }
  }

  return json({ naming, model: MODEL, fallbackUsed })
})
