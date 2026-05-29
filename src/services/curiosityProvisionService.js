import {
  CURIOSITY_DIFFICULTY,
  CURIOSITY_LOAD_POINTS,
  CURIOSITY_STUDY_ROTATION,
  CURIOSITY_TRACK,
} from '@/constants/curiosity'
import { QUEST_SOURCE_TYPES } from '@/constants/questEngine'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { QUEST_KIND } from '@/constants/questLifecycle'
import { createQuestEntries, getQuestsForAssignedDate } from '@/services/questService'
import { getCuriosityDisplayState } from '@/services/curiosityRotationService'
import { getQuestDueDate } from '@/utils/quest'
import { isoWeekdayFromYmd } from '@/utils/curiosityPeriod'

export function shouldAddCuriosityQuest(packed) {
  if (!packed?.length) return true
  const hardLegendary = packed.filter(
    (q) => q.difficulty === 'hard' || q.difficulty === 'legendary',
  ).length
  return hardLegendary < packed.length || packed.length <= 1
}

function studyTrackForDay(ymd) {
  const idx = (isoWeekdayFromYmd(ymd) - 1) % CURIOSITY_STUDY_ROTATION.length
  return CURIOSITY_STUDY_ROTATION[idx]
}

function buildStudyCandidate(profile, track) {
  if (track === CURIOSITY_TRACK.BOOK_STUDY && profile.curiosity_book_title) {
    return {
      title: `Reading — ${profile.curiosity_book_title}`,
      curiosityTrack: CURIOSITY_TRACK.BOOK_STUDY,
      contextNote: `Month book. Short session: article, video, or chapter notes (~15 min).`,
    }
  }
  if (track === CURIOSITY_TRACK.COUNTRY_STUDY && profile.curiosity_country) {
    return {
      title: `Country study — ${profile.curiosity_country}`,
      curiosityTrack: CURIOSITY_TRACK.COUNTRY_STUDY,
      contextNote: `This week’s country. Culture, history, economy — quick exploration (~15 min).`,
    }
  }
  if (track === CURIOSITY_TRACK.PROFESSION_STUDY && profile.curiosity_profession) {
    return {
      title: `Profession study — ${profile.curiosity_profession}`,
      curiosityTrack: CURIOSITY_TRACK.PROFESSION_STUDY,
      contextNote: `This week’s field. How the profession works — videos or articles (~15 min).`,
    }
  }
  return null
}

function entryFromCuriosity(candidate, todayYmd) {
  return {
    taskPoolId: null,
    curiosityTrack: candidate.curiosityTrack,
    title: candidate.title,
    period: QUEST_PERIODS.DAILY,
    assignedDate: todayYmd,
    dueDate: getQuestDueDate(QUEST_PERIODS.DAILY),
    xpReward: 0,
    xpPenalty: 0,
    sourceType: QUEST_SOURCE_TYPES.CURIOSITY,
    difficulty: CURIOSITY_DIFFICULTY,
    fearLevel: 1,
    questKind: QUEST_KIND.LEARNING,
    loadPoints: CURIOSITY_LOAD_POINTS,
    carryover: false,
    analysisSnapshot: {
      curiosity_track: candidate.curiosityTrack,
      context: candidate.contextNote,
    },
    accepted: true,
  }
}

export async function provisionCuriosityQuestsForToday({ profile, todayYmd, packed = [] }) {
  const state = getCuriosityDisplayState(profile, todayYmd)
  if (!state.enabled || state.pending) return []

  const existing = await getQuestsForAssignedDate(todayYmd, QUEST_PERIODS.DAILY)
  const curiosityToday = existing.filter((q) => q.source_type === QUEST_SOURCE_TYPES.CURIOSITY)
  if (curiosityToday.length) return []

  const candidates = []

  if (state.weekActive && state.needsWrapUp && profile.curiosity_country && profile.curiosity_profession) {
    const weekWrapExists = existing.some(
      (q) =>
        q.source_type === QUEST_SOURCE_TYPES.CURIOSITY &&
        (q.curiosity_track === CURIOSITY_TRACK.WEEK_WRAP_UP ||
          q.analysis_snapshot?.curiosity_track === CURIOSITY_TRACK.WEEK_WRAP_UP) &&
        !['completed', 'failed'].includes(q.status),
    )
    if (!weekWrapExists) {
      candidates.push({
        title: `Curiosity wrap-up — ${profile.curiosity_profession} · ${profile.curiosity_country}`,
        curiosityTrack: CURIOSITY_TRACK.WEEK_WRAP_UP,
        contextNote: `Summarize what you learned this week about the profession and country.`,
      })
    }
  }

  if (!candidates.length && shouldAddCuriosityQuest(packed) && state.weekActive && !state.needsWrapUp) {
    const track = studyTrackForDay(todayYmd)
    const study = buildStudyCandidate(profile, track)
    if (study) candidates.push(study)
  }

  if (!candidates.length) return []

  const entries = candidates.map((c) => entryFromCuriosity(c, todayYmd))
  return createQuestEntries(entries)
}
