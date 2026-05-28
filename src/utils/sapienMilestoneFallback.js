const TITLES_BY_TIER = {
  spark: ['First Spark', 'Daybreak Oath', 'Seed of Will', 'Awakening'],
  ember: ['Ember Chain', 'Week Forged', 'Steady Flame', 'Rhythm Held'],
  forge: ['Iron Groove', 'Month Forged', 'Deep Habit', 'Anvil Soul'],
  oath: ['Sacred Oath', 'Unbroken Pact', 'Quarter Stone', 'Temple Step'],
  temple: ['Inner Temple', 'Century Gate', 'Soul Architecture', 'Living Doctrine'],
  legend: ['Legend Mark', 'Eternal Return', 'Throne of Habit', 'Ascendant Form'],
  mythic: ['Mythic Binding', 'Year Crown', 'Demi-God Trace', 'Transcendent Self'],
}

const TAGLINES = [
  'The System notes your consistency.',
  'You returned when it was easier to slip.',
  'Discipline compounds in silence.',
  'The chain held. You held with it.',
  'Identity follows repetition.',
  'Another layer of you is forged.',
]

export function pickSapienMilestoneFallback(habitTitle, days, tier = 'spark') {
  const pool = TITLES_BY_TIER[tier] ?? TITLES_BY_TIER.spark
  const title = pool[((habitTitle?.length ?? 0) + days) % pool.length]
  return `${days}-Day ${title}`
}

export function pickSapienMilestoneFallbackTagline(days) {
  return TAGLINES[days % TAGLINES.length]
}
