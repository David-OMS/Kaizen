import { XP_EVENT_TYPES } from '@/constants/xpEvents'

const EVENT_CATEGORY = {
  [XP_EVENT_TYPES.HUNT_LAUNCHED]: 'hunt',
  [XP_EVENT_TYPES.HUNT_OUTCOME_SUCCESSFUL]: 'hunt',
  [XP_EVENT_TYPES.HUNT_OUTCOME_REJECTED]: 'hunt',
  [XP_EVENT_TYPES.HUNT_OUTCOME_GHOSTED]: 'hunt',
  [XP_EVENT_TYPES.REACHOUT_SENT]: 'hunt',
  [XP_EVENT_TYPES.PROPOSAL_SENT]: 'hunt',
  [XP_EVENT_TYPES.CLIENT_SIGNED]: 'raid',
  [XP_EVENT_TYPES.RAID_BATTLE]: 'spoil',
  [XP_EVENT_TYPES.RAID_RECURRING_CLAIM]: 'spoil',
  [XP_EVENT_TYPES.RAID_RETREAT]: 'raid',
  [XP_EVENT_TYPES.RAID_COMPLETE]: 'raid',
  [XP_EVENT_TYPES.DAILY_QUEST_COMPLETED]: 'quest',
  [XP_EVENT_TYPES.WEEKLY_QUEST_COMPLETED]: 'quest',
  [XP_EVENT_TYPES.DAILY_QUEST_FAILED]: 'quest',
  [XP_EVENT_TYPES.WEEKLY_QUEST_FAILED]: 'quest',
  [XP_EVENT_TYPES.SYSTEM_QUEST_REJECTED]: 'quest',
  [XP_EVENT_TYPES.INVOICE_PAID]: 'treasury',
  [XP_EVENT_TYPES.REJECTION_RECEIVED]: 'hunt',
}

const DEFAULT_TITLES = {
  [XP_EVENT_TYPES.RAID_RETREAT]: 'Battle retreat',
  [XP_EVENT_TYPES.RAID_BATTLE]: 'Spoils claimed',
  [XP_EVENT_TYPES.RAID_RECURRING_CLAIM]: 'Tribute claimed',
  [XP_EVENT_TYPES.CLIENT_SIGNED]: 'Raid commenced',
  [XP_EVENT_TYPES.RAID_COMPLETE]: 'Dungeon cleared',
}

/** @param {{ amount: number, eventType?: string, description?: string, presentation?: object }} */
export function buildXpRewardSurprise({ amount, eventType, description, presentation = {} }) {
  const category = presentation.category ?? EVENT_CATEGORY[eventType] ?? 'meta'
  const title =
    presentation.title ??
    DEFAULT_TITLES[eventType] ??
    (eventType ? String(eventType).replace(/_/g, ' ') : 'System reward')

  return {
    kind: presentation.kind ?? 'reward',
    title,
    description: presentation.description ?? description ?? 'The System has recorded this action.',
    xp_reward: presentation.xp_reward ?? amount,
    category,
    alwaysShow: Boolean(presentation.alwaysShow),
  }
}
