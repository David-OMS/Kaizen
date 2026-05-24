export type RaidRewardNaming = {
  ritualName: string
  ritualTagline: string
}

export const FALLBACK_RAID_REWARD: RaidRewardNaming = {
  ritualName: 'Unnamed Spoil',
  ritualTagline: 'Gold claimed from the dungeon floor.',
}

function clampStr(s: unknown, max: number, fallback: string): string {
  const t = typeof s === 'string' ? s.trim() : ''
  if (!t) return fallback
  return t.slice(0, max)
}

export function clampRaidRewardNaming(raw: Record<string, unknown>): RaidRewardNaming {
  return {
    ritualName: clampStr(raw.ritualName, 48, FALLBACK_RAID_REWARD.ritualName),
    ritualTagline: clampStr(raw.ritualTagline, 160, FALLBACK_RAID_REWARD.ritualTagline),
  }
}
