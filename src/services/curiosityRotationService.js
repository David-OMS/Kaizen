import { invokePickCuriosityThemes } from '@/services/curiosityAiService'
import { updateProfileQuestFields } from '@/services/questService'
import {
  isoWeekdayFromYmd,
  mondayOfWeekYmd,
  monthKeyFromYmd,
  nextMondayYmd,
  parseJsonStringArray,
} from '@/utils/curiosityPeriod'
import { getTodayYmdInTimezone, getProfileTimezone } from '@/utils/questTimezone'

function history(profile) {
  return {
    booksDone: parseJsonStringArray(profile.curiosity_books_done),
    countriesDone: parseJsonStringArray(profile.curiosity_countries_done),
    professionsDone: parseJsonStringArray(profile.curiosity_professions_done),
  }
}

async function pickAndPatch(profile, pick, extra = {}) {
  const { booksDone, countriesDone, professionsDone } = history(profile)
  const picked = await invokePickCuriosityThemes({
    pick,
    booksDone,
    countriesDone,
    professionsDone,
    profile,
  })
  const patch = { ...extra }
  if (picked.book) patch.curiosity_book_title = picked.book
  if (picked.country) patch.curiosity_country = picked.country
  if (picked.profession) patch.curiosity_profession = picked.profession
  return updateProfileQuestFields(patch)
}

/**
 * Sync book/month and week themes. Call at start of daily provision.
 */
export async function syncCuriosityRotation(profile, todayYmd) {
  if (profile.curiosity_enabled === false) return profile

  const monday = mondayOfWeekYmd(todayYmd)
  const monthKey = monthKeyFromYmd(todayYmd)
  const { booksDone, countriesDone, professionsDone } = history(profile)
  let patch = {}
  let p = profile

  const startsOn = profile.curiosity_starts_on
  if (startsOn && todayYmd < startsOn) {
    return profile
  }

  if (!profile.curiosity_book_title) {
    p = await pickAndPatch(p, 'book', { curiosity_book_month: monthKey, curiosity_starts_on: null })
  } else if (profile.curiosity_book_month !== monthKey) {
    patch.curiosity_book_month = monthKey
  }

  const weekStart = profile.curiosity_week_start
  const wrapDone = Boolean(profile.curiosity_week_wrap_up_done)

  if (!weekStart) {
    if (todayYmd === monday) {
      p = await pickAndPatch(p, 'week', {
        curiosity_week_start: monday,
        curiosity_week_wrap_up_done: false,
        curiosity_starts_on: null,
      })
    } else if (!startsOn) {
      patch.curiosity_starts_on = nextMondayYmd(todayYmd)
    }
  } else if (weekStart < monday && wrapDone) {
    const prevCountry = profile.curiosity_country
    const prevProfession = profile.curiosity_profession
    const nextCountries = prevCountry ? [...new Set([...countriesDone, prevCountry])] : countriesDone
    const nextProfessions = prevProfession
      ? [...new Set([...professionsDone, prevProfession])]
      : professionsDone
    p = await pickAndPatch(p, 'week', {
      curiosity_week_start: monday,
      curiosity_week_wrap_up_done: false,
      curiosity_countries_done: nextCountries,
      curiosity_professions_done: nextProfessions,
      curiosity_starts_on: null,
    })
  } else if (weekStart < monday && !wrapDone) {
    // Same themes until wrap-up is done
  }

  if (Object.keys(patch).length) {
    p = await updateProfileQuestFields(patch)
  }

  return p
}

export async function markCuriosityBookComplete(profile) {
  const title = profile.curiosity_book_title
  if (!title) throw new Error('No active book.')

  const booksDone = [...new Set([...history(profile).booksDone, title])]
  const monthKey = monthKeyFromYmd(getTodayYmdInTimezone(getProfileTimezone(profile)))

  await updateProfileQuestFields({
    curiosity_books_done: booksDone,
    curiosity_book_title: null,
    curiosity_book_month: null,
  })

  const cleared = { ...profile, curiosity_books_done: booksDone, curiosity_book_title: null }
  return pickAndPatch(cleared, 'book', { curiosity_book_month: monthKey })
}

export async function onCuriosityWrapUpPassed(profile, quest) {
  const track = quest.curiosity_track || quest.analysis_snapshot?.curiosity_track
  if (track !== 'week_wrap_up') return profile

  return updateProfileQuestFields({
    curiosity_week_wrap_up_done: true,
  })
}

export function getCuriosityDisplayState(profile, todayYmd) {
  const monday = mondayOfWeekYmd(todayYmd)
  const startsOn = profile.curiosity_starts_on
  const pending = startsOn && todayYmd < startsOn
  const weekActive = profile.curiosity_week_start && !pending
  const weekday = isoWeekdayFromYmd(todayYmd)
  const weekRolledPendingWrap =
    profile.curiosity_week_start && profile.curiosity_week_start < monday && !profile.curiosity_week_wrap_up_done
  const needsWrapUp =
    weekActive &&
    !profile.curiosity_week_wrap_up_done &&
    profile.curiosity_week_start &&
    (weekday >= 6 || weekRolledPendingWrap)

  return {
    enabled: profile.curiosity_enabled !== false,
    pending,
    startsOn,
    book: profile.curiosity_book_title,
    bookMonth: profile.curiosity_book_month,
    country: profile.curiosity_country,
    profession: profile.curiosity_profession,
    weekStart: profile.curiosity_week_start,
    needsWrapUp,
    weekActive,
  }
}
