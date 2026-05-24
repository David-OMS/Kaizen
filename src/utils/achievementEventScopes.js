import { ACHIEVEMENT_CATEGORIES } from '@/constants/achievementTypes'

import { ACHIEVEMENT_DEFS } from '@/constants/achievementCatalog'

import {

  TREASURY_EXPENSE_KEYS,

  TREASURY_INCOME_EVENT_KEYS,

  TREASURY_SESSION_SURPRISE_KEYS,

} from '@/constants/treasuryAchievements'



const HUNT_KEYS = new Set(

  ACHIEVEMENT_DEFS.filter((d) => d.category === ACHIEVEMENT_CATEGORIES.HUNT).map((d) => d.key),

)



const RAID_KEYS = new Set(

  ACHIEVEMENT_DEFS.filter((d) => d.category === ACHIEVEMENT_CATEGORIES.RAID).map((d) => d.key),

)



const SPOIL_KEYS = new Set(

  ACHIEVEMENT_DEFS.filter((d) => d.category === ACHIEVEMENT_CATEGORIES.SPOIL).map((d) => d.key),

)



const PROFILE_KEYS = new Set(

  ACHIEVEMENT_DEFS.filter((d) => d.category === ACHIEVEMENT_CATEGORIES.PROFILE).map((d) => d.key),

)



const QUEST_KEYS = new Set(

  ACHIEVEMENT_DEFS.filter((d) => d.category === ACHIEVEMENT_CATEGORIES.QUEST).map((d) => d.key),

)



const TREASURY_KEYS = new Set(

  ACHIEVEMENT_DEFS.filter((d) => d.category === ACHIEVEMENT_CATEGORIES.TREASURY).map((d) => d.key),

)



const TREASURY_INCOME_KEYS = new Set(TREASURY_INCOME_EVENT_KEYS)

const TREASURY_EXPENSE_EVENT_KEY_SET = new Set(TREASURY_EXPENSE_KEYS)

const RAID_INCOME_KEYS = new Set([...SPOIL_KEYS, ...TREASURY_INCOME_KEYS])



const SESSION_SURPRISE_KEYS = new Set(['RECORD_THIS_DOT_ZERO', ...TREASURY_SESSION_SURPRISE_KEYS])



const EVENT_KEY_FILTERS = {

  session_sync: SESSION_SURPRISE_KEYS,

  hunt_launched: HUNT_KEYS,

  hunt_outcome_successful: new Set(['GREEN_LIGHT']),

  hunt_outcome_rejected: new Set(['IRON_WILL', 'REJECTION_RAIN', 'HUNDRED_REJECTIONS']),

  hunt_outcome_ghosted: new Set(['GHOST_WALK']),

  client_signed: RAID_KEYS,

  raid_battle: RAID_INCOME_KEYS,

  raid_retreat: SPOIL_KEYS,

  raid_recurring_claim: RAID_INCOME_KEYS,

  raid_complete: RAID_KEYS,

  invoice_paid: TREASURY_INCOME_KEYS,

  treasury_expense_logged: TREASURY_EXPENSE_EVENT_KEY_SET,

  daily_quest_completed: QUEST_KEYS,

  weekly_quest_completed: QUEST_KEYS,

  monthly_review_logged: new Set(['MONTH_ONE']),

  rank_sync: PROFILE_KEYS,

}



export function filterAchievementKeysForEvent(catalogKeys, eventType) {

  const allowed = EVENT_KEY_FILTERS[eventType]

  if (!allowed) return []

  return catalogKeys.filter((key) => allowed.has(key))

}



export function shouldShowSurpriseForUnlock(catalogKey, eventType) {

  if (eventType === 'session_sync') {

    return SESSION_SURPRISE_KEYS.has(catalogKey)

  }

  return true

}


