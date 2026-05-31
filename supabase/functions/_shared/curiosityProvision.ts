import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { mergeHunterProfileContext } from './hunterProfile.ts'
import {
  getWeekBoundsForYmd,
  isoWeekdayFromYmd,
  mondayOfWeekYmd,
  monthKeyFromYmd,
  nextMondayYmd,
  parseJsonStringArray,
} from './curiosityPeriod.ts'

const CURIOSITY_TRACK = {
  BOOK_STUDY: 'book_study',
  COUNTRY_STUDY: 'country_study',
  PROFESSION_STUDY: 'profession_study',
  WEEK_WRAP_UP: 'week_wrap_up',
} as const

const STUDY_ROTATION = [
  CURIOSITY_TRACK.BOOK_STUDY,
  CURIOSITY_TRACK.COUNTRY_STUDY,
  CURIOSITY_TRACK.PROFESSION_STUDY,
]

type Profile = Record<string, unknown>

async function fetchPickCuriosityThemes(
  supabaseUrl: string,
  serviceKey: string,
  payload: Record<string, unknown>,
): Promise<{ book: string | null; country: string | null; profession: string | null }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/pick-curiosity-themes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { book: null, country: null, profession: null }
    const body = await res.json()
    return {
      book: body.book ? String(body.book) : null,
      country: body.country ? String(body.country) : null,
      profession: body.profession ? String(body.profession) : null,
    }
  } catch {
    return { book: null, country: null, profession: null }
  }
}

function history(profile: Profile) {
  return {
    booksDone: parseJsonStringArray(profile.curiosity_books_done),
    countriesDone: parseJsonStringArray(profile.curiosity_countries_done),
    professionsDone: parseJsonStringArray(profile.curiosity_professions_done),
  }
}

async function patchProfile(supabase: SupabaseClient, userId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase.from('profile').update(patch).eq('id', userId).select('*').single()
  if (error) throw error
  return data as Profile
}

/** Sync book/month and week themes — same rules as client curiosityRotationService. */
export async function syncCuriosityRotation(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile,
  todayYmd: string,
  opts: { supabaseUrl: string; serviceKey: string },
): Promise<Profile> {
  if (profile.curiosity_enabled === false) return profile

  const monday = mondayOfWeekYmd(todayYmd)
  const monthKey = monthKeyFromYmd(todayYmd)
  const { booksDone, countriesDone, professionsDone } = history(profile)
  let patch: Record<string, unknown> = {}
  let p = profile

  const startsOn = profile.curiosity_starts_on as string | null | undefined
  if (startsOn && todayYmd < startsOn) return profile

  const pickPayload = {
    hunterVision: mergeHunterProfileContext(profile),
    hunterGoals: profile.hunter_goals ?? '',
    booksDone,
    countriesDone,
    professionsDone,
  }

  if (!profile.curiosity_book_title) {
    const picked = await fetchPickCuriosityThemes(opts.supabaseUrl, opts.serviceKey, {
      ...pickPayload,
      pick: 'book',
    })
    if (picked.book) {
      p = await patchProfile(supabase, userId, {
        curiosity_book_title: picked.book,
        curiosity_book_month: monthKey,
        curiosity_starts_on: null,
      })
    }
  } else if (profile.curiosity_book_month !== monthKey) {
    patch.curiosity_book_month = monthKey
  }

  const weekStart = profile.curiosity_week_start as string | null | undefined
  const wrapDone = Boolean(profile.curiosity_week_wrap_up_done)

  if (!weekStart) {
    if (todayYmd === monday) {
      const picked = await fetchPickCuriosityThemes(opts.supabaseUrl, opts.serviceKey, {
        ...pickPayload,
        pick: 'week',
      })
      p = await patchProfile(supabase, userId, {
        curiosity_week_start: monday,
        curiosity_week_wrap_up_done: false,
        curiosity_starts_on: null,
        ...(picked.country ? { curiosity_country: picked.country } : {}),
        ...(picked.profession ? { curiosity_profession: picked.profession } : {}),
      })
    } else if (!startsOn) {
      patch.curiosity_starts_on = nextMondayYmd(todayYmd)
    }
  } else if (weekStart < monday && wrapDone) {
    const prevCountry = profile.curiosity_country as string | undefined
    const prevProfession = profile.curiosity_profession as string | undefined
    const nextCountries = prevCountry ? [...new Set([...countriesDone, prevCountry])] : countriesDone
    const nextProfessions = prevProfession ? [...new Set([...professionsDone, prevProfession])] : professionsDone
    const picked = await fetchPickCuriosityThemes(opts.supabaseUrl, opts.serviceKey, {
      ...pickPayload,
      pick: 'week',
    })
    p = await patchProfile(supabase, userId, {
      curiosity_week_start: monday,
      curiosity_week_wrap_up_done: false,
      curiosity_countries_done: nextCountries,
      curiosity_professions_done: nextProfessions,
      curiosity_starts_on: null,
      ...(picked.country ? { curiosity_country: picked.country } : {}),
      ...(picked.profession ? { curiosity_profession: picked.profession } : {}),
    })
  }

  if (Object.keys(patch).length) {
    p = await patchProfile(supabase, userId, patch)
  }

  return p
}

function curiosityDisplayState(profile: Profile, todayYmd: string) {
  const monday = mondayOfWeekYmd(todayYmd)
  const pending = Boolean(profile.curiosity_starts_on && todayYmd < String(profile.curiosity_starts_on))
  const weekActive = Boolean(profile.curiosity_week_start && !pending)
  const weekday = isoWeekdayFromYmd(todayYmd)
  const weekRolledPendingWrap =
    Boolean(profile.curiosity_week_start) &&
    String(profile.curiosity_week_start) < monday &&
    !profile.curiosity_week_wrap_up_done
  const needsWrapUp =
    weekActive &&
    !profile.curiosity_week_wrap_up_done &&
    Boolean(profile.curiosity_week_start) &&
    (weekday >= 6 || weekRolledPendingWrap)

  return { enabled: profile.curiosity_enabled !== false, pending, weekActive, needsWrapUp }
}

function shouldAddCuriosityQuest(packed: { difficulty?: string; loadPoints?: number }[]): boolean {
  if (!packed.length) return true
  const hardLegendary = packed.filter((q) => q.difficulty === 'hard' || q.difficulty === 'legendary').length
  return hardLegendary < packed.length || packed.length <= 1
}

function studyTrackForDay(ymd: string): string {
  const idx = (isoWeekdayFromYmd(ymd) - 1) % STUDY_ROTATION.length
  return STUDY_ROTATION[idx]
}

function buildStudyCandidate(profile: Profile, track: string) {
  if (track === CURIOSITY_TRACK.BOOK_STUDY && profile.curiosity_book_title) {
    return {
      title: `Reading — ${profile.curiosity_book_title}`,
      curiosityTrack: CURIOSITY_TRACK.BOOK_STUDY,
      contextNote: 'Month book. Short session: article, video, or chapter notes (~15 min).',
    }
  }
  if (track === CURIOSITY_TRACK.COUNTRY_STUDY && profile.curiosity_country) {
    return {
      title: `Country study — ${profile.curiosity_country}`,
      curiosityTrack: CURIOSITY_TRACK.COUNTRY_STUDY,
      contextNote: 'This week’s country. Culture, history, economy — quick exploration (~15 min).',
    }
  }
  if (track === CURIOSITY_TRACK.PROFESSION_STUDY && profile.curiosity_profession) {
    return {
      title: `Profession study — ${profile.curiosity_profession}`,
      curiosityTrack: CURIOSITY_TRACK.PROFESSION_STUDY,
      contextNote: 'This week’s field. How the profession works — videos or articles (~15 min).',
    }
  }
  return null
}

export async function provisionCuriosityQuestsForToday(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile,
  todayYmd: string,
  packed: { difficulty?: string; loadPoints?: number }[],
): Promise<number> {
  const state = curiosityDisplayState(profile, todayYmd)
  if (!state.enabled || state.pending) return 0

  const { data: existing } = await supabase
    .from('quests')
    .select('id, source_type, status, curiosity_track, analysis_snapshot')
    .eq('user_id', userId)
    .eq('period', 'daily')
    .eq('assigned_date', todayYmd)

  if ((existing ?? []).some((q) => q.source_type === 'curiosity')) return 0

  const candidates: { title: string; curiosityTrack: string; contextNote: string }[] = []

  if (state.weekActive && state.needsWrapUp && profile.curiosity_country && profile.curiosity_profession) {
    const weekWrapExists = (existing ?? []).some(
      (q) =>
        q.source_type === 'curiosity' &&
        (q.curiosity_track === CURIOSITY_TRACK.WEEK_WRAP_UP ||
          (q.analysis_snapshot as Record<string, unknown>)?.curiosity_track === CURIOSITY_TRACK.WEEK_WRAP_UP) &&
        !['completed', 'failed'].includes(q.status),
    )
    if (!weekWrapExists) {
      candidates.push({
        title: `Curiosity wrap-up — ${profile.curiosity_profession} · ${profile.curiosity_country}`,
        curiosityTrack: CURIOSITY_TRACK.WEEK_WRAP_UP,
        contextNote: 'Summarize what you learned this week about the profession and country.',
      })
    }
  }

  if (!candidates.length && shouldAddCuriosityQuest(packed) && state.weekActive && !state.needsWrapUp) {
    const study = buildStudyCandidate(profile, studyTrackForDay(todayYmd))
    if (study) candidates.push(study)
  }

  if (!candidates.length) return 0

  const rows = candidates.map((c) => ({
    user_id: userId,
    task_pool_id: null,
    title: c.title,
    period: 'daily',
    assigned_date: todayYmd,
    due_date: todayYmd,
    status: 'active',
    xp_reward: 0,
    xp_penalty: 0,
    source_type: 'curiosity',
    reward_visibility: 'known',
    accepted: true,
    difficulty: 'easy',
    fear_level: 1,
    quest_kind: 'learning',
    load_points: 1,
    carryover: false,
    assessment_status: 'none',
    extension_count: 0,
    curiosity_track: c.curiosityTrack,
    analysis_snapshot: { curiosity_track: c.curiosityTrack, context: c.contextNote },
  }))

  const { error } = await supabase.from('quests').insert(rows)
  if (error) throw error
  return rows.length
}
