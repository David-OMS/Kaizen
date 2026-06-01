import { corsHeaders } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { isCronOrServiceRequest } from '../_shared/cronAuth.ts'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'

const WEST_AFRICA_COUNTRIES = [
  'Senegal',
  'Ghana',
  "Côte d'Ivoire",
  'Mali',
  'Benin',
  'Togo',
  'Burkina Faso',
  'Niger',
  'Cameroon',
  'Gabon',
  'Rwanda',
  'Ethiopia',
  'Morocco',
  'Tunisia',
]

const WORLD_COUNTRIES = [
  'Japan',
  'Brazil',
  'Peru',
  'Chile',
  'Argentina',
  'Iceland',
  'Norway',
  'Portugal',
  'Greece',
  'Turkey',
  'Georgia',
  'India',
  'Vietnam',
  'Thailand',
  'Indonesia',
  'South Korea',
  'Mexico',
  'Colombia',
  'Egypt',
  'Jordan',
  'Oman',
  'New Zealand',
  'Australia',
  'Czech Republic',
  'Poland',
  'Uruguay',
  ...WEST_AFRICA_COUNTRIES,
]

const FALLBACK_BOOKS = [
  'The Psychology of Money',
  'Never Split the Difference',
  'Deep Work',
  'The Mom Test',
  'Sapiens',
  'Thinking in Systems',
  'The Art of Learning',
  'Meditations',
]

const FALLBACK_PROFESSIONS = [
  'Law',
  'Medicine',
  'Civil Engineering',
  'Urban Planning',
  'Public Policy',
  'Diplomacy',
  'Marine Biology',
  'Architecture',
  'Theatre',
  'Agriculture',
]

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function pickFromPool<T>(pool: T[], done: string[], compare: (item: T) => string): T {
  const available = pool.filter((item) => !done.includes(compare(item)))
  const source = available.length ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

/** ~30% West Africa, ~70% anywhere in the world — never the user's default region by default. */
function pickCountry(countriesDone: string[]): string {
  const useWestAfrica = Math.random() < 0.3
  const pool = useWestAfrica ? WEST_AFRICA_COUNTRIES : WORLD_COUNTRIES
  return pickFromPool(pool, countriesDone, (c) => c)
}

function fallbackBook(booksDone: string[]) {
  return pickFromPool(FALLBACK_BOOKS, booksDone, (t) => t)
}

function fallbackProfession(professionsDone: string[]) {
  return pickFromPool(FALLBACK_PROFESSIONS, professionsDone, (p) => p)
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

  const needBook = pick === 'book' || pick === 'all'
  const needWeek = pick === 'week' || pick === 'all'

  const country = needWeek ? pickCountry(countriesDone) : null

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    return json({
      book: needBook ? fallbackBook(booksDone) : null,
      country,
      profession: needWeek ? fallbackProfession(professionsDone) : null,
      fallbackUsed: true,
    })
  }

  const prompt = `You pick themes for a CURIOSITY engine — broadening a person's worldview. This is NOT their work task list. Return JSON only:
{ "book": string|null, "country": string|null, "profession": string|null }

pick=${pick}: ${needBook ? 'set book' : 'book must be null'}; ${needWeek ? 'set profession only (country is already chosen)' : 'profession must be null; country must be null'}

BOOK (if needed):
- One real published non-fiction title: wisdom, history, psychology, communication, craft, or a surprising lens on the world.
- NOT in: ${JSON.stringify(booksDone)}
- Avoid over-assigned startup canon (Lean Startup, Zero to One, Atomic Habits) unless nothing else fits.
- Do NOT pick a book only because it matches someone's job.

PROFESSION (if needed):
- Any field of human work worldwide — Law, Medicine, Theatre, Forestry, IT, Shipbuilding, Archaeology, etc. are all valid.
- NOT in: ${JSON.stringify(professionsDone)}
- Pick as if drawing from a hat. Do not default to the reader's industry just because you assume they are in tech.

COUNTRY: already set to "${country}" — return null for country in JSON.

No explanations. Be surprising and varied.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.95,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Curiosity picker. JSON only. Prefer orthogonal, global, non-obvious choices.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) throw new Error('openai')
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    const parsed = text ? JSON.parse(text) : {}
    let book = needBook ? String(parsed.book || fallbackBook(booksDone)).slice(0, 120) : null
    const profession = needWeek
      ? String(parsed.profession || fallbackProfession(professionsDone)).slice(0, 80)
      : null
    if (book && booksDone.includes(book)) book = fallbackBook(booksDone)
    return json({ book, country, profession, fallbackUsed: false })
  } catch {
    return json({
      book: needBook ? fallbackBook(booksDone) : null,
      country,
      profession: needWeek ? fallbackProfession(professionsDone) : null,
      fallbackUsed: true,
    })
  }
})
