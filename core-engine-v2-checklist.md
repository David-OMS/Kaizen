# Core Engine V2 Implementation Checklist

Purpose: execution-ready checklist derived from `core-engine-v2-plan.md`.

## Phase 0: Lock Decisions

- [ ] Rank gates enforced on top of level thresholds
- [ ] Hunt count gate uses logged hunts (any outcome)
- [ ] Failed attempts always give minimum XP
- [ ] Raid XP uses difficultyScore path (no double multiplier)
- [ ] OpenAI tier set to balanced
- [x] Daily quest generation dynamic (3 to 5)

## Phase 1: Formula Engine

- [x] Add `xpEngine` constants (base XP, multipliers, caps)
- [x] Add deterministic `calculateXP(input)` utility
- [x] Add `xpToReachLevel(level)` utility
- [x] Add `deriveLevel(totalXP)` utility
- [x] Add `deriveRank(level)` utility
- [x] Add rank gate evaluator utility
- [x] Route all XP updates through formula -> `addXP(...)`

## Phase 2: Data Model Migration

- [x] Migrate raid statuses to canonical:
  - `pending`, `ongoing`, `completed`, `failed`
- [x] Add quest fields:
  - `difficulty`, `fear_level`, `source_type`, `reward_visibility`, `accepted`, `analysis_snapshot`
- [x] Add hunt fields:
  - `fear_level`, `analysis_snapshot`
- [x] Add/normalize profile fields:
  - `total_xp`, cached `level`, cached `rank`
- [x] Add skills structure:
  - `skill_type`, `xp`, `level`, `curriculum_tier`, `active`
- [x] Create `skill_milestones` table
- [x] Create `skill_arcs` table (see Phase 4)

## Phase 3: Level/Rank Runtime

- [x] Recompute level and rank after each XP event
- [x] Apply rank gate checks before promotion
- [x] Persist cached profile level/rank
- [x] Trigger locked-content unlock checks post-promotion

## Phase 4: Skills and Skill Arc (Your line-166 add)

- [x] Implement 2-layer skill model:
  - core skills (fixed)
  - domain skills (dynamic)
- [x] Implement low-noise quest skill impact:
  - optional only
  - one primary + optional secondary
- [x] Implement Skill Arc lifecycle:
  - `proposed -> accepted -> active -> verification -> unlocked/paused`
- [x] Enforce max active arcs (start with 1)
- [x] Arc structure:
  - one weekly anchor quest
  - three to five daily support quests
- [x] Unlock skill on arc completion (+ optional verification pass)

## Phase 5: Daily Modal + System Quests

- [x] Add login-time daily modal (open once/day)
- [x] Show generated daily quests in modal
- [x] Add AI system quest event:
  - "A new quest has arrived"
  - accept/reject
  - known or unknown reward mode
- [x] Add reject policy rules (penalty or token)

## Phase 6: OpenAI Integration

- [x] Build server endpoint: Quest Analyzer
- [x] Build server endpoint: Raid Analyzer
- [x] Enforce strict output schema and clamp rules
- [x] Add fallback defaults on AI failure
- [x] Store `analysis_snapshot` + model version
- [x] Cache repeated requests by content hash

## Phase 7: Verification Layer

- [x] Build AI mini exam/interview generator for skill verification
- [x] Add pass/fail threshold
- [x] On pass: unlock/tier-up target skill
- [x] On fail: keep base quest XP and preserve retry path

## Phase 8: Reconciliation and QA

- [ ] Backfill totalXP from `xp_log`
- [ ] Recompute profile level/rank for all users
- [ ] Validate gates vs existing data
- [ ] Validate addXP remains sole XP write path
- [ ] Validate quest_log append-only still enforced
- [ ] UX pass on modal flows and noise control

## Done Definition

- [ ] All quest/hunt/raid/dungeon XP is formula-driven
- [ ] Rank cannot advance without gate conditions
- [ ] Skill bars are curriculum-backed (not fake progress)
- [ ] Skill Arc flow works end-to-end
- [ ] AI analysis and fallback paths are stable
