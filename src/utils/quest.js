import { endOfWeek, format, startOfDay } from 'date-fns'
import { QUEST_PERIODS } from '@/constants/questOptions'
import { calculateXP } from '@/utils/xpEngine'

export function getQuestDueDate(period) {
  if (period === QUEST_PERIODS.DAILY) {
    return format(startOfDay(new Date()), 'yyyy-MM-dd')
  }
  return format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function getQuestRewards(period) {
  if (period === QUEST_PERIODS.DAILY) {
    const reward = calculateXP({
      activityType: 'quest',
      difficulty: 'medium',
      fearLevel: 2,
      speed: 'on_time',
      quality: 'good',
    })

    return {
      reward,
      penalty: Math.round(reward * 0.35),
    }
  }

  const reward = calculateXP({
    activityType: 'quest',
    difficulty: 'hard',
    fearLevel: 3,
    speed: 'on_time',
    quality: 'good',
  })

  return {
    reward,
    penalty: Math.round(reward * 0.4),
  }
}