import { ACHIEVEMENT_CATEGORIES as C } from '@/constants/achievementTypes'
import { TREASURY_REVENUE_MILESTONE_DEFS } from '@/constants/treasuryMilestoneTiers'

/**
 * Milestone definitions only. Keys are stable; titles/lines come from AI on unlock.
 * xpReward is bundled into the surprise (addXP via achievement row).
 */
export const ACHIEVEMENT_MILESTONE_DEFS = [
  // Profile / session — fresh account handshake
  { key: 'RECORD_THIS_DOT_ZERO', legacyTitle: 'Record This.0', triggerHint: 'Blank slate: profile XP zero, no events logged yet.', xpReward: 50, secret: true, category: C.PROFILE },

  // Hunts — breadth + depth
  { key: 'OPENING_STRIKE', legacyTitle: 'Opening Strike', triggerHint: 'First hunt launched into the field.', xpReward: 35, secret: true, category: C.HUNT },
  { key: 'HUNT_MARK_5', legacyTitle: 'Hunt Mark V', triggerHint: 'Five hunts logged.', xpReward: 45, secret: true, category: C.HUNT },
  { key: 'TRIPLE_MARK', legacyTitle: 'Triple Mark', triggerHint: 'Three hunts logged total.', xpReward: 40, secret: true, category: C.HUNT },
  { key: 'HUNT_MARK_25', legacyTitle: 'Hunt Mark XXV', triggerHint: 'Twenty-five hunts logged.', xpReward: 90, secret: true, category: C.HUNT },
  { key: 'FIELD_PRESSURE', legacyTitle: 'Field Pressure', triggerHint: 'Ten hunts launched; outreach is routine now.', xpReward: 85, secret: true, category: C.HUNT },
  { key: 'THE_GRIND_BEGINS', legacyTitle: 'The Grind Begins', triggerHint: 'Ten hunts on record; the grind is real.', xpReward: 70, secret: true, category: C.HUNT },
  { key: 'HUNT_MARK_50', legacyTitle: 'Hunt Mark L', triggerHint: 'Fifty hunts logged.', xpReward: 140, secret: true, category: C.HUNT },
  { key: 'HUNT_MARK_100', legacyTitle: 'Hunt Mark C', triggerHint: 'One hundred hunts logged.', xpReward: 220, secret: true, category: C.HUNT },
  { key: 'HUNT_OUTCOME_FIRST', legacyTitle: 'Outcome Locked', triggerHint: 'First hunt moved out of pending into a final outcome.', xpReward: 40, secret: true, category: C.HUNT },
  { key: 'HUNT_PENDING_STACK_3', legacyTitle: 'Triple Thread', triggerHint: 'Three hunts in flight at once.', xpReward: 35, secret: true, category: C.HUNT },
  { key: 'GREEN_LIGHT', legacyTitle: 'Green Light', triggerHint: 'First successful hunt outcome.', xpReward: 55, secret: true, category: C.HUNT },
  { key: 'IRON_WILL', legacyTitle: 'Iron Will', triggerHint: 'First rejection outcome on a hunt.', xpReward: 40, secret: true, category: C.HUNT },
  { key: 'GHOST_WALK', legacyTitle: 'Ghost Walk', triggerHint: 'First ghosted hunt outcome.', xpReward: 40, secret: true, category: C.HUNT },
  { key: 'REJECTION_RAIN', legacyTitle: 'Rejection Rain', triggerHint: 'Ten hunt rejections logged.', xpReward: 100, secret: true, category: C.HUNT },
  { key: 'HUNDRED_REJECTIONS', legacyTitle: '100 Rejections', triggerHint: 'One hundred hunt rejections survived.', xpReward: 280, secret: true, category: C.HUNT },
  { key: 'FEAR_PEAK_FIRST', legacyTitle: 'Peak Fear', triggerHint: 'A hunt logged at maximum fear rating.', xpReward: 30, secret: true, category: C.HUNT },

  // Raids
  { key: 'RAID_PIONEER', legacyTitle: 'Raid Pioneer', triggerHint: 'First raid registered in the System.', xpReward: 90, secret: true, category: C.RAID },
  { key: 'RAID_MARK_5', legacyTitle: 'Raid Mark V', triggerHint: 'Five raids on record.', xpReward: 55, secret: true, category: C.RAID },
  { key: 'FIRST_BLOOD', legacyTitle: 'First Blood', triggerHint: 'First client signed; raid has begun.', xpReward: 115, secret: true, category: C.RAID },
  { key: 'DUAL_WIELDING', legacyTitle: 'Dual Wielding', triggerHint: 'Two active raids at the same time.', xpReward: 125, secret: true, category: C.RAID },
  { key: 'TRIPLE_GATE', legacyTitle: 'Triple Gate', triggerHint: 'Three active raids simultaneously.', xpReward: 150, secret: true, category: C.RAID },
  { key: 'TEN_DUNGEONS', legacyTitle: 'Ten Dungeons', triggerHint: 'Ten raids on record.', xpReward: 110, secret: true, category: C.RAID },
  { key: 'RAID_MARK_25', legacyTitle: 'Raid Mark XXV', triggerHint: 'Twenty-five raids on record.', xpReward: 160, secret: true, category: C.RAID },
  { key: 'RAID_MARK_50', legacyTitle: 'Raid Mark L', triggerHint: 'Fifty raids on record.', xpReward: 240, secret: true, category: C.RAID },
  { key: 'FULL_CAPACITY', legacyTitle: 'Full Capacity', triggerHint: 'Every raid slot filled at once.', xpReward: 175, secret: true, category: C.RAID },
  { key: 'B_RANK_CONTRACT', legacyTitle: 'B-Rank Contract', triggerHint: 'First B-rank raid registered.', xpReward: 120, secret: true, category: C.RAID },
  { key: 'RANK_C_SIGIL', legacyTitle: 'C-Rank Sigil', triggerHint: 'First C-rank raid registered.', xpReward: 95, secret: true, category: C.RAID },
  { key: 'A_RANK_LICENSE', legacyTitle: 'A-Rank License', triggerHint: 'First A-rank raid registered.', xpReward: 155, secret: true, category: C.RAID },
  { key: 'S_RANK_WHISPER', legacyTitle: 'S-Rank Whisper', triggerHint: 'First S-rank raid registered.', xpReward: 220, secret: true, category: C.RAID },
  { key: 'DUNGEON_CLOSED', legacyTitle: 'Dungeon Closed', triggerHint: 'First raid marked complete.', xpReward: 95, secret: true, category: C.RAID },
  { key: 'RAID_DONE_5', legacyTitle: 'Five Clears', triggerHint: 'Five raids closed complete.', xpReward: 85, secret: true, category: C.RAID },

  // Spoils & streams
  { key: 'FIRST_SPOILS', legacyTitle: 'First Spoils', triggerHint: 'First spoil claimed from a raid.', xpReward: 75, secret: true, category: C.SPOIL },
  { key: 'SPOIL_MARK_5', legacyTitle: 'Spoil Mark V', triggerHint: 'Five spoils recorded.', xpReward: 55, secret: true, category: C.SPOIL },
  { key: 'SPOIL_HOARDER', legacyTitle: 'Spoil Hoarder', triggerHint: 'Ten spoils recorded.', xpReward: 130, secret: true, category: C.SPOIL },
  { key: 'SPOIL_MARK_25', legacyTitle: 'Spoil Mark XXV', triggerHint: 'Twenty-five spoils recorded.', xpReward: 165, secret: true, category: C.SPOIL },
  { key: 'SPOIL_MARK_50', legacyTitle: 'Spoil Mark L', triggerHint: 'Fifty spoils recorded.', xpReward: 220, secret: true, category: C.SPOIL },
  { key: 'HEAVY_CHEST', legacyTitle: 'Heavy Chest', triggerHint: 'A single large spoil payment logged.', xpReward: 110, secret: true, category: C.SPOIL },
  { key: 'MEGA_DROP', legacyTitle: 'Mega Drop', triggerHint: 'An exceptional one-off spoil amount.', xpReward: 145, secret: true, category: C.SPOIL },
  { key: 'TRIBUTE_STREAM', legacyTitle: 'Tribute Stream', triggerHint: 'First recurring spoil stream opened.', xpReward: 90, secret: true, category: C.SPOIL },
  { key: 'THREE_MOONS', legacyTitle: 'Three Moons', triggerHint: 'Three recurring tribute claims collected.', xpReward: 100, secret: true, category: C.SPOIL },
  { key: 'STREAM_STACK_5', legacyTitle: 'Five Streams', triggerHint: 'Five recurring spoil streams active or created.', xpReward: 85, secret: true, category: C.SPOIL },
  { key: 'TRIBUTE_YEAR', legacyTitle: 'Tribute Year', triggerHint: 'Twelve recurring claims collected total.', xpReward: 130, secret: true, category: C.SPOIL },
  { key: 'TREASURY_FLOOD', legacyTitle: 'Treasury Flood', triggerHint: 'Lifetime vault received crosses a major threshold.', xpReward: 180, secret: true, category: C.SPOIL },
  { key: 'TREASURY_TSUNAMI', legacyTitle: 'Treasury Tsunami', triggerHint: 'Lifetime vault received crosses an elite threshold.', xpReward: 320, secret: true, category: C.SPOIL },

  // Rank / XP ladder
  { key: 'HUNTER_LICENSE', legacyTitle: 'Hunter License', triggerHint: 'Attained hunter rank D.', xpReward: 85, secret: true, category: C.PROFILE },
  { key: 'ARCHITECT_AWAKENED', legacyTitle: 'Architect Awakened', triggerHint: 'Attained rank C.', xpReward: 125, secret: true, category: C.PROFILE },
  { key: 'FIELD_OPERATOR', legacyTitle: 'Field Operator', triggerHint: 'Attained rank B.', xpReward: 170, secret: true, category: C.PROFILE },
  { key: 'GUILD_LEADER', legacyTitle: 'Guild Leader', triggerHint: 'Attained rank A.', xpReward: 235, secret: true, category: C.PROFILE },
  { key: 'SHADOW_MONARCH', legacyTitle: 'Shadow Monarch', triggerHint: 'Attained rank S.', xpReward: 380, secret: true, category: C.PROFILE },
  { key: 'XP_BURST_500', legacyTitle: 'XP Burst I', triggerHint: 'Total lifetime XP crosses a first tier.', xpReward: 40, secret: true, category: C.PROFILE },
  { key: 'XP_BURST_2500', legacyTitle: 'XP Burst II', triggerHint: 'Total lifetime XP crosses a mid tier.', xpReward: 80, secret: true, category: C.PROFILE },
  { key: 'XP_BURST_10000', legacyTitle: 'XP Burst III', triggerHint: 'Total lifetime XP crosses a high tier.', xpReward: 140, secret: true, category: C.PROFILE },
  { key: 'XP_BURST_50000', legacyTitle: 'XP Burst IV', triggerHint: 'Total lifetime XP crosses a monstrous tier.', xpReward: 250, secret: true, category: C.PROFILE },
  { key: 'LEVEL_BREAK_5', legacyTitle: 'Level Break V', triggerHint: 'Character level reaches five.', xpReward: 50, secret: true, category: C.PROFILE },
  { key: 'LEVEL_BREAK_10', legacyTitle: 'Level Break X', triggerHint: 'Character level reaches ten.', xpReward: 75, secret: true, category: C.PROFILE },
  { key: 'LEVEL_BREAK_20', legacyTitle: 'Level Break XX', triggerHint: 'Character level reaches twenty.', xpReward: 110, secret: true, category: C.PROFILE },

  // Quests & discipline
  { key: 'STREAK_EMBER_3', legacyTitle: 'Streak Ember', triggerHint: 'Three-day daily quest streak.', xpReward: 35, secret: true, category: C.QUEST },
  { key: 'CONSISTENT', legacyTitle: 'Consistent', triggerHint: 'Seven-day daily quest streak.', xpReward: 95, secret: true, category: C.QUEST },
  { key: 'STREAK_INFERNO_14', legacyTitle: 'Streak Inferno', triggerHint: 'Fourteen-day daily quest streak.', xpReward: 130, secret: true, category: C.QUEST },
  { key: 'MONTH_OF_DISCIPLINE', legacyTitle: 'Month of Discipline', triggerHint: 'Thirty-day streak peak reached.', xpReward: 220, secret: true, category: C.QUEST },
  { key: 'DAILY_CLEAR_5', legacyTitle: 'Daily Clear V', triggerHint: 'Five daily quests completed total.', xpReward: 40, secret: true, category: C.QUEST },
  { key: 'DAILY_CLEAR_25', legacyTitle: 'Daily Clear XXV', triggerHint: 'Twenty-five daily quests completed total.', xpReward: 85, secret: true, category: C.QUEST },
  { key: 'DAILY_CLEAR_100', legacyTitle: 'Daily Clear C', triggerHint: 'One hundred daily quests completed total.', xpReward: 160, secret: true, category: C.QUEST },
  { key: 'WEEKLY_CLEAR', legacyTitle: 'Weekly Clear', triggerHint: 'First weekly quest completed.', xpReward: 65, secret: true, category: C.QUEST },
  { key: 'WEEKLY_CLEAR_5', legacyTitle: 'Weekly Clear V', triggerHint: 'Five weekly quests completed total.', xpReward: 90, secret: true, category: C.QUEST },
  { key: 'WEEKLY_CLEAR_25', legacyTitle: 'Weekly Clear XXV', triggerHint: 'Twenty-five weekly quests completed total.', xpReward: 150, secret: true, category: C.QUEST },
  { key: 'QUEST_TAX', legacyTitle: 'System Tax', triggerHint: 'A quest logged as failed — the grind still counts.', xpReward: 25, secret: true, category: C.QUEST },

  // Treasury — raid-linked received (spoils + tribute claims)
  { key: 'OPEN_ACCOUNT', legacyTitle: 'Open Account', triggerHint: 'First payment recorded in the vault (spoil or tribute).', xpReward: 80, secret: true, category: C.TREASURY },
  { key: 'INVOICE_RAIN_5', legacyTitle: 'Inflow Rain V', triggerHint: 'Five vault inflows recorded (spoils + tribute claims).', xpReward: 60, secret: true, category: C.TREASURY },
  { key: 'INVOICE_RAIN_25', legacyTitle: 'Inflow Rain XXV', triggerHint: 'Twenty-five vault inflows recorded.', xpReward: 120, secret: true, category: C.TREASURY },
  { key: 'INFLOW_RAIN_50', legacyTitle: 'Inflow Rain L', triggerHint: 'Fifty vault inflows recorded.', xpReward: 165, secret: true, category: C.TREASURY },
  { key: 'INFLOW_RAIN_100', legacyTitle: 'Inflow Rain C', triggerHint: 'One hundred vault inflows recorded.', xpReward: 240, secret: true, category: C.TREASURY },
  ...TREASURY_REVENUE_MILESTONE_DEFS,
  { key: 'TREASURY_ZERO_OUTSTANDING', legacyTitle: 'Ledger Clear', triggerHint: 'No outstanding spoils or ready tribute waiting in the vault.', xpReward: 90, secret: true, category: C.TREASURY },
  { key: 'LEDGER_FIRST_DEBIT', legacyTitle: 'First Debit', triggerHint: 'First expense logged in treasury.', xpReward: 35, secret: true, category: C.TREASURY },
  { key: 'LEDGER_DEBIT_5', legacyTitle: 'Debit Mark V', triggerHint: 'Five expenses logged.', xpReward: 45, secret: true, category: C.TREASURY },
  { key: 'LEDGER_DEBIT_25', legacyTitle: 'Debit Mark XXV', triggerHint: 'Twenty-five expenses logged.', xpReward: 85, secret: true, category: C.TREASURY },
  { key: 'TREASURY_HEAVY_MONTH', legacyTitle: 'Heavy Month', triggerHint: 'Expenses this month cross a major spend threshold.', xpReward: 65, secret: true, category: C.TREASURY },
  { key: 'TREASURY_PROFIT_MONTH', legacyTitle: 'Profit Month', triggerHint: 'This month net profit (received minus expenses) is strongly positive.', xpReward: 100, secret: true, category: C.TREASURY },

  // Meta / reviews
  { key: 'MONTH_ONE', legacyTitle: 'Month One', triggerHint: 'First monthly review logged.', xpReward: 55, secret: false, category: C.PROFILE },
  { key: 'BACKFILLED', legacyTitle: 'Backfilled', triggerHint: 'First manually backfilled history entry.', xpReward: 30, secret: false, category: C.META },
]
