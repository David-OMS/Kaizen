import { isoWeekdayFromYmd } from '@/utils/curiosityPeriod'

export const SUNDAY_MENTAL_LOAD_POINTS = 1

export function isSundayYmd(ymd) {
  return isoWeekdayFromYmd(ymd) === 7
}

export function filterSundayCarryovers(carryovers) {
  return (carryovers ?? []).filter((c) => c.mandatory)
}

export function filterSundayPoolCandidates(candidates) {
  return (candidates ?? []).filter((c) => c.mandatory)
}

/** Skip AI mental quest only when mandatory work today is genuinely heavy. */
export function shouldAddSundayMentalQuest(packed) {
  const rows = packed ?? []
  const mandatory = rows.filter((q) => q.mandatory)
  if (!mandatory.length) return true
  return !mandatory.some(
    (q) =>
      q.difficulty === 'hard' ||
      q.difficulty === 'legendary' ||
      Number(q.loadPoints ?? q.load_points ?? 0) >= 4,
  )
}

export function isSundayMentalQuest(quest) {
  return Boolean(quest?.analysis_snapshot?.sunday_mental)
}
