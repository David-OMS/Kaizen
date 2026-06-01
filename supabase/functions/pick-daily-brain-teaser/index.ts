import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { isCronOrServiceRequest } from '../_shared/cronAuth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
const MAX_LEN = 280

const FALLBACK_FACTS = [
  'Honey never spoils — edible honey has been found in ancient Egyptian tombs.',
  'Octopuses have three hearts and blue blood.',
  'A day on Venus is longer than a year on Venus.',
  'Bananas are berries; strawberries are not.',
  'There are more trees on Earth than stars in the Milky Way (rough estimate).',
]

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeFact(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_LEN)
}

function fallbackFact(factsSeen: string[]): string {
  const available = FALLBACK_FACTS.filter((f) => !factsSeen.includes(f))
  const pool = available.length ? available : FALLBACK_FACTS
  return pool[Math.floor(Math.random() * pool.length)]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!(await isCronOrServiceRequest(req))) {
    const { user, error } = await requireUser(req)
    if (!user) return json({ error: error ?? 'Unauthorized' }, 401)
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { factsSeen?: string[] } = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const factsSeen = Array.isArray(body.factsSeen) ? body.factsSeen.map(String) : []
  const key = Deno.env.get('OPENAI_API_KEY')

  if (!key) {
    return json({ fact: fallbackFact(factsSeen), fallbackUsed: true })
  }

  const prompt = `Generate ONE brain-teaser fact for a gamified productivity app. Return JSON only: { "fact": string }

Rules:
- One sentence (max 220 chars). Weird, funny, surprising, or delightful — true or widely accepted trivia.
- Pick a RANDOM domain each time: animals, space, food, history, language, sports, music, geography, human body, inventions, ocean, art, math, etc.
- Must NOT closely paraphrase any of these already shown facts: ${JSON.stringify(factsSeen.slice(-80))}
- No quizzes, no questions — just the fact.
- No political hot takes, no graphic content.
- Do not mention the user's job, country, or goals.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You output one novel trivia fact as JSON. Be unpredictable.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) throw new Error('openai')
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    const parsed = text ? JSON.parse(text) : {}
    let fact = normalizeFact(String(parsed.fact || ''))
    if (!fact || factsSeen.some((seen) => seen.toLowerCase() === fact.toLowerCase())) {
      fact = fallbackFact(factsSeen)
    }
    return json({ fact, fallbackUsed: false })
  } catch {
    return json({ fact: fallbackFact(factsSeen), fallbackUsed: true })
  }
})
