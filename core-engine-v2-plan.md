# Core Engine V2 Plan (Review First, No Implementation Yet)

Purpose: define a stable, formula-driven progression engine before more feature work. 

This plan focuses on:

1. XP formula mechanics
2. Level and rank progression mechanics
3. Skill progression mechanics
4. Activity models (Quest, Hunt, Raid, Dungeon)
5. OpenAI integration design (Quest/Raid analyzer)
6. Migration strategy from current system to V2

---

## 1) Target Player Loop

Desired loop:

Create quest -> AI analyzes -> Quest appears in daily modal -> Complete quest -> Gain XP -> Skills increase -> Level updates -> Rank updates.

Core requirement:

- XP must be formula-based (not hardcoded per event only).
- Level and rank must be deterministic and explainable.
- AI should classify and suggest values, but rules engine remains authoritative.

---

## 2) Canonical Formulas (Proposed)

## 2.1 XP Formula

For any activity completion:

finalXP = round(baseXP(activityType) * difficultyMultiplier * fearMultiplier * speedMultiplier * qualityMultiplier * streakMultiplier) + bonusXP

Where:

- baseXP(activityType):
  - quest: 60
  - hunt: 40
  - raid action: 90
  - skill learning session: 50
  - dungeon milestone: 140

- difficultyMultiplier:
  - easy: 1.0
  - medium: 1.5
  - hard: 2.3
  - legendary: 3.5

- fearMultiplier:
  - 1: 1.0
  - 2: 1.15
  - 3: 1.35
  - 4: 1.7
  - 5: 2.2

- speedMultiplier:
  - late: 0.9
  - on_time: 1.0
  - fast: 1.15

- qualityMultiplier:
  - failed: 0.25
  - partial: 0.6
  - good: 1.0
  - excellent: 1.25

- streakMultiplier:
  - min(1.3, 1 + 0.02 * currentStreak)

- bonusXP:
  - conversion, first-time milestones, etc.

Rule:

- All computed XP is sent through addXP(amount, eventType, description).

## 2.2 Level Formula

Use cumulative thresholds:

xpToReachLevel(L) = round(120 * L^1.55)

Derived level:

- highest L where totalXP >= xpToReachLevel(L)

No subtraction loop in storage:

- totalXP remains lifetime sum
- current level is derived and cached on profile after XP events

## 2.3 Rank Formula

Rank by level:

- E: 1-9
- D: 10-19
- C: 20-34
- B: 35-49
- A: 50-69
- S: 70+

Rank gates (mandatory in addition to level):

- D: no gate
- C: at least 2 signed raids
- B: at least 4 signed raids + 30 logged hunts (any outcome counts)
- A: at least 6 signed raids + 2 completed dungeons
- S: at least 10 signed raids + 5 completed dungeons + at least one 30-day streak peak

Rule:

- If level threshold is met but gate is not met, user stays at current rank until gate passes.

---

## 3) Activity Models (V2 Semantics)

## 3.1 Quests

- Source: task pool
- AI sets suggested difficulty + fear + optional skill impact
- Daily modal displays generated quests on login
- Completion computes XP via formula, not fixed constants
- AI can generate system quests directly ("A new quest has arrived")
- System quest supports:
  - accept/reject choice
  - reward visibility mode: known or unknown ("?")
  - optional reject cost rules (configured later)

## 3.2 Hunts

- Prospecting actions
- Status: sent/replied/rejected/converted
- XP computed with formula (fear and difficulty matter)

## 3.3 Raids

- Engagement/work objects with rank and status
- Status: pending/ongoing/completed/failed (canonical in DB and UI)
- Use direct schema migration (no permanent legacy status mapping layer)
- Raid rank impacts rewards indirectly through difficultyScore (single source, avoids double multipliers)

## 3.4 Dungeons

- Long-running optional initiatives
- Have milestone-based XP (not only end reward)
- Can span weeks/months

---

## 4) Skill Progression Model

Goal:

- avoid noisy "too many bars" skill spam
- still support meaningful progression + surprise unlocks

Two-layer skill model:

- Core skills (small fixed set for long-term identity)
- Domain skills (dynamic, AI/user-generated, e.g. PostgreSQL, Excel formulas) - yeah for example, a domain skill could span a week. so it becomes a weekly quest. and then when introduced becomes part of the daily quest. and then when completed. skill unlocked. you get?

Quest-to-skill rule (low-noise):

- Skill impact is optional per quest
- If present: one primary skill, optional secondary skill
- Not every quest has a skill map

Curriculum requirement (for any skill with progress bar):

- each skill has a lightweight 3-tier curriculum:
  - Foundation
  - Applied
  - Operational
- progress comes from milestones + verified completions

Verification mode (optional per skill quest):

- AI mini exam/interview can verify claimed completion
- passing verification can unlock new skill or tier
- failing verification still keeps base quest XP (attempts always count)

Skill level:

skillLevel = floor(skillXP / 500)

Skill rewards come from analyzer suggestion + deterministic rules engine.

---

## 5) OpenAI Integration Plan

OpenAI is used for classification/scoring, not direct DB writes.

## 5.1 AI Feature A: Quest Analyzer

Input:

- title
- optional context

Output schema:

- difficulty (easy/medium/hard/legendary)
- fearLevel (1-5)
- category (build/outreach/learning/admin)
- skillImpact (optional):
  - primarySkill
  - secondarySkill (optional)
  - unlockCandidate (boolean)
- confidence (0-1)

## 5.2 AI Feature B: Raid Analyzer

Input:

- raid title
- description
- scope hints

Output schema:

- difficultyScore (0-100)
- rank (E-S)
- suggested duration estimate
- estimatedXPBase
- suggestedSkillImpact (optional)

## 5.3 Architecture

Frontend:

- Calls backend endpoint, never OpenAI directly.

Backend (Supabase Edge Function or small API):

- Validates request
- Calls OpenAI with strict JSON schema response format
- Validates/parses model response
- Applies guardrails/clamps
- Returns normalized payload to client

Persistence:

- Save analyzer outputs on quest/raid records as "analysis_snapshot".
- Final XP still computed server-side using deterministic formula util.

## 5.4 Guardrails

- Clamp outputs:
  - fearLevel 1-5
  - difficulty only allowed enum
  - skillImpact max 2 skills (primary + optional secondary)
  - reject malformed skill names or route to "needs review"
- Fallback if AI fails:
  - medium difficulty
  - fearLevel 2
  - no skill impact
- Track model version in each analysis snapshot for audit/tuning.

## 5.5 Cost and Reliability

- Run analyzer on create, not on every render.
- Cache repeated titles/context hashes for short window.
- Add retry with timeout and fallback.

---

## 6) Data/Schema Additions (Planned)

Proposed additions (exact SQL later after approval):

- quests:
  - difficulty
  - fear_level
  - speed_rating (optional)
  - quality_rating (optional)
  - reward_visibility (known|unknown)
  - source_type (task_pool|system_generated)
  - accepted (boolean)
  - analysis_snapshot jsonb

- task_pool:
  - category
  - default_difficulty
  - default_fear_level
  - preferred_primary_skill (optional)

- clients/raids:
  - difficulty_score
  - status migrated to pending|ongoing|completed|failed
  - analysis_snapshot jsonb

- hunts:
  - fear_level
  - analysis_snapshot jsonb

- skills:
  - skill_type (core|domain)
  - xp (numeric)
  - level (cached)
  - curriculum_tier
  - active (boolean)

- skill_milestones (new table):
  - skill_id
  - tier
  - title
  - completed
  - verified

- profile:
  - total_xp (if not already canonical)
  - level (cached derived)
  - rank (cached derived)

Note: keep xp_log source-of-truth rule unchanged.

---

## 7) Migration Strategy (Safe)

Phase M1: Engine introduction

- Add formula utilities and config constants.
- Keep old event constants temporarily for compatibility.

Phase M2: Dual-write period

- New activities compute formula XP.
- Legacy actions still allowed but mapped to formula defaults.

Phase M3: Full cutover

- Remove fixed XP assumptions in quest/hunt/raid flows.
- Rank derives from level only (or level + gates if approved).

Phase M4: Reconciliation

- Recompute cached level/rank from totalXP.
- Verify achievements/locked-content triggers.

---

## 8) Acceptance Criteria

System is "core complete" when:

- Every quest/hunt/raid/dungeon completion uses formula XP.
- addXP is the only XP entry point.
- Level updates automatically from totalXP.
- Rank updates automatically from level thresholds.
- Daily quest modal opens once per day on login.
- Skill XP and level update from activity rewards.
- AI analyzers return normalized outputs with fallback behavior.

---

## 9) Open Decisions for Approval

Resolved decisions:

1. Keep milestone gates on top of level-based rank? -> Yes
2. Failed actions grant zero XP? -> No (attempts always award minimum XP)
3. Raid rank XP influence mode -> Indirect via difficultyScore only
4. OpenAI model tier -> Balanced
5. Daily quest count -> Dynamic (default 3, up to 5 when low-effort capacity is detected)

Additional accepted constraints:

- 30 logged hunts in B gate counts any outcome (not only successful conversions)
- AI can issue system-generated quests with accept/reject choice and optional unknown rewards
- Use proper raid status migration instead of long-term mapping hacks
- Skills must use low-noise optional impact model + curriculum-backed progress bars

---

## 10) Next Step After Approval

After your signoff, implementation starts in this order:

1. constants + formula utilities
2. server-side XP computation entry helper
3. level/rank recalculation service
4. daily modal behavior
5. AI analyzer endpoints
6. schema migration + UI wiring
