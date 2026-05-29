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

function fallbackBook(booksDone: string[]) {
  const pool = [
    'The Psychology of Money',
    'Never Split the Difference',
    'Deep Work',
    'The Mom Test',
    'Atomic Habits',
  ]
  const pick = pool.find((t) => !booksDone.includes(t)) ?? pool[0]
  return pick
}

function fallbackCountry(countriesDone: string[]) {
  const pool = ['Senegal', 'Ghana', 'Côte d\'Ivoire', 'France', 'Morocco', 'Rwanda', 'Kenya']
  return pool.find((c) => !countriesDone.includes(c)) ?? pool[Math.floor(Math.random() * pool.length)]
}

function fallbackProfession(professionsDone: string[]) {
  const pool = ['Law', 'Medicine', 'Civil Engineering', 'Urban Planning', 'Public Policy', 'Diplomacy']
  return pool.find((p) => !professionsDone.includes(p)) ?? pool[Math.floor(Math.random() * pool.length)]
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

  const pick = String(body.pick ?? 'all')
  const booksDone = Array.isArray(body.booksDone) ? body.booksDone.map(String) : []
  const countriesDone = Array.isArray(body.countriesDone) ? body.countriesDone.map(String) : []
  const professionsDone = Array.isArray(body.professionsDone) ? body.professionsDone.map(String) : []
  const hunterVision = String(body.hunterVision ?? '')
  const hunterGoals = String(body.hunterGoals ?? '')

  const key = Deno.env.get('OPENAI_API_KEY')
  const needBook = pick === 'book' || pick === 'all'
  const needWeek = pick === 'week' || pick === 'all'

  if (!key) {
    return json({
      book: needBook ? fallbackBook(booksDone) : null,
      country: needWeek ? fallbackCountry(countriesDone) : null,
      profession: needWeek ? fallbackProfession(professionsDone) : null,
      fallbackUsed: true,
    })
  }

  const prompt = `Pick curiosity study themes for a solo founder. Return JSON only:
{ "book": string|null, "country": string|null, "profession": string|null }
Rules:
- pick=${pick}: ${needBook ? 'include book' : 'book must be null'}; ${needWeek ? 'include country AND profession' : 'country and profession must be null'}
- Book: one real published non-fiction title useful for business/finance/systems/communication; NOT in: ${JSON.stringify(booksDone)}
- Country: one country (not in ${JSON.stringify(countriesDone)}), relevant to West Africa / ECOWAS / francophone world when possible
- Profession: one field to explore for general knowledge (not in ${JSON.stringify(professionsDone)}); e.g. Law, Medicine, Civil Engineering
- Align with hunter context when possible
- No explanations

Hunter vision: ${hunterVision}
Current goals: ${hunterGoals}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
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
    const book = needBook ? String(parsed.book || fallbackBook(booksDone)).slice(0, 120) : null
    const country = needWeek
      ? String(parsed.country || fallbackCountry(countriesDone)).slice(0, 80)
      : null
    const profession = needWeek
      ? String(parsed.profession || fallbackProfession(professionsDone)).slice(0, 80)
      : null
    return json({ book, country, profession, fallbackUsed: false })
  } catch {
    return json({
      book: needBook ? fallbackBook(booksDone) : null,
      country: needWeek ? fallbackCountry(countriesDone) : null,
      profession: needWeek ? fallbackProfession(professionsDone) : null,
      fallbackUsed: true,
    })
  }
})
