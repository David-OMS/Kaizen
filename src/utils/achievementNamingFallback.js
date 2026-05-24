/** Client-side random titles when AI is unavailable — still varied per playthrough. */

const POOLS = {
  RECORD_THIS_DOT_ZERO: ['Hunter Awakening', 'Mana Activated', 'System Link', 'Gate Recognition', 'Zero Layer'],
  OPENING_STRIKE: ['Hunter Awakening', 'First Mark', 'Field Entry', 'Mana Activated', 'Gate Opened'],
  TRIPLE_MARK: ['Triple Echo', 'Third Signal', 'Pattern Forming', 'Marks Aligned'],
  FIELD_PRESSURE: ['Pressure Wave', 'Tenfold Reach', 'Grind State', 'Relentless Field'],
  GREEN_LIGHT: ['Green Signal', 'Door Ajar', 'Positive Echo', 'Path Lit'],
  IRON_WILL: ['Iron Nerve', 'Rejection Forged', 'Will Tempered', 'Scar Earned'],
  GHOST_WALK: ['Ghost Trail', 'Silent Exit', 'Void Reply', 'Hollow Ping'],
  REJECTION_RAIN: ['Rain of No', 'Storm Resist', 'Thick Skin II'],
  HUNDRED_REJECTIONS: ['Century of No', 'Immune Ego', 'Rejection Monarch'],
  THE_GRIND_BEGINS: ['Grind Ignition', 'Loop Started', 'Daily Hunger'],
  RAID_PIONEER: ['Dungeon Listed', 'Raid Registered', 'Contract Spark'],
  FIRST_BLOOD: ['First Blood', 'Client Bound', 'Deal Sealed'],
  DUAL_WIELDING: ['Twin Raids', 'Double Gate', 'Dual Channel'],
  FULL_CAPACITY: ['Capacity Max', 'Slots Full', 'No Room Left'],
  TEN_DUNGEONS: ['Tenfold Raid', 'Dungeon Decade', 'Raid Stack'],
  B_RANK_CONTRACT: ['B-Rank Seal', 'Mid-Tier Pact', 'Blue Contract'],
  A_RANK_LICENSE: ['A-Rank Clearance', 'Elite Stamp', 'High Gate'],
  S_RANK_WHISPER: ['S-Rank Murmur', 'Top Tier Ping', 'Monarch Hint'],
  DUNGEON_CLOSED: ['Dungeon Sealed', 'Raid Closed', 'Clear Mark'],
  FIRST_SPOILS: ['First Spoils', 'Loot Registered', 'Chest Opened'],
  SPOIL_HOARDER: ['Spoil Stack', 'Treasury Hum', 'Gold Trail'],
  HEAVY_CHEST: ['Heavy Chest', 'Fat Loot', 'Weight Class'],
  TRIBUTE_STREAM: ['Tribute Flow', 'Monthly Drip', 'Stream Open'],
  THREE_MOONS: ['Three Moons', 'Triple Tribute', 'Cycle Claim'],
  HUNTER_LICENSE: ['Hunter License', 'Rank D Stamp', 'Class Registered'],
  ARCHITECT_AWAKENED: ['Architect Rise', 'Rank C Spark', 'Blueprint Live'],
  FIELD_OPERATOR: ['Field Operator', 'Rank B Live', 'Operator Mode'],
  GUILD_LEADER: ['Guild Leader', 'Rank A Crown', 'Leader Mark'],
  SHADOW_MONARCH: ['Shadow Monarch', 'Rank S Echo', 'Monarch Slot'],
  CONSISTENT: ['Seven Flame', 'Streak Forged', 'Daily Chain'],
  MONTH_OF_DISCIPLINE: ['Thirty Suns', 'Iron Month', 'Discipline Max'],
  WEEKLY_CLEAR: ['Weekly Clear', 'Boss Down', 'Week Sealed'],
  OPEN_ACCOUNT: ['Treasury Open', 'Coin Inflow', 'Account Live'],
  TREASURY_ZERO_OUTSTANDING: ['Ledger Clear', 'Zero Due', 'All Collected'],
  LEDGER_FIRST_DEBIT: ['First Debit', 'Expense Spark', 'Outflow One'],
  TREASURY_HEAVY_MONTH: ['Heavy Month', 'Burn Season', 'Expense Wave'],
  TREASURY_PROFIT_MONTH: ['Profit Month', 'Net Positive', 'Black Ledger'],
  MONTH_ONE: ['Month One', 'Review Logged', 'Cycle One'],
  BACKFILLED: ['History Rewrite', 'Past Accepted', 'Backfill Done'],
}

const REVENUE_FALLBACK_POOL = [
  'Vault Signal',
  'Treasury Mark',
  'Coin Threshold',
  'Hoard Record',
  'Ledger Milestone',
]

export function pickAchievementFallback(catalogKey) {
  if (
    catalogKey?.startsWith('TREASURY_VAULT_') ||
    catalogKey?.startsWith('TREASURY_MONTH_')
  ) {
    return REVENUE_FALLBACK_POOL[Math.floor(Math.random() * REVENUE_FALLBACK_POOL.length)]
  }
  const pool = POOLS[catalogKey] ?? ['System Notice', 'Hidden Record', 'Milestone Logged']
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickAchievementFallbackTagline(catalogKey) {
  const lines = [
    'The System etched this into your record.',
    'A new line appeared in the hunter log.',
    'You will not see this name twice on a fresh run.',
  ]
  const i = (catalogKey?.length ?? 0) % lines.length
  return lines[i]
}
