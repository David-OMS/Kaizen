import { differenceInCalendarDays, parseISO } from 'date-fns'

export function getDaysSinceFounding(foundingDate) {
  if (!foundingDate) return 0
  return Math.max(0, differenceInCalendarDays(new Date(), parseISO(foundingDate)))
}