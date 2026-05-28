/** Sapien progression: Mortal → Demi-God (separate from Hunter rank). */
export const SAPIEN_RANKS = [
  { key: 'mortal', title: 'Mortal', minXp: 0 },
  { key: 'initiate', title: 'Initiate', minXp: 40 },
  { key: 'disciplined', title: 'Disciplined', minXp: 120 },
  { key: 'ascendant', title: 'Ascendant', minXp: 280 },
  { key: 'paragon', title: 'Paragon', minXp: 550 },
  { key: 'transcendent', title: 'Transcendent', minXp: 900 },
  { key: 'demigod', title: 'Demi-God', minXp: 1400 },
]

export const SAPIEN_DEFAULT_XP_PER_CLAIM = 10

export const SAPIEN_HABIT_KIND = {
  ONCE: 'once',
  COUNT: 'count',
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
