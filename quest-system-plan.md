# Quest system — implementation plan

Living spec for the OMS quest loop (task pool, daily/weekly assignment, assessments, carryover, mandatory recycle).  
**Do not treat example numbers in conversation as fixed product constants** — tune everything in `src/constants/questBudget.js`.

---

## Product principles (locked)

1. **Task pool** = backlog only. Add tasks anytime. No XP for adding to the pool.
2. **Daily assignment** runs on a **schedule (05:00 user timezone)**, not when the hunter wakes up. On login, quests already exist → **“Daily quests are ready”**.
3. **Assignment cap is adaptive**, not a fixed “6 per day.” **Starting expectation: ~3 tasks** — the hunter may not even finish 3 yet. System learns upward if they consistently clear the pack.
4. **Difficulty budget** decides how many quests actually land that day (can be **1** on a heavy day, **up to** the adaptive cap on easy days). Never bombard.
5. **Carryovers consume today’s budget** (extended/recycled/mandatory from yesterday are part of today’s load, not extra on top).
6. **Pool + AI** fill the budget in one pass (AI does not add quests after the day is packed).
7. **Execution tasks**: mark done → XP. **Learning tasks**: mark done → assessment same calendar day → XP only if pass (AI may grant partial on fail).
8. **Incomplete + reason** → **AI required** to judge if reason is solid → extension or penalty.
9. **Mandatory** pool items recycle until **done**. Optional items reshuffle; **preference** for previously dropped/incomplete on next assign.
10. **“All tasks must be done”** = mandatory real work eventually completes; outcomes can be fail/incomplete along the way, but mandatory work keeps coming back.

---

## Current state (baseline)

| Area | Today |
|------|--------|
| Task pool | CRUD; `type` daily/weekly/both; no mandatory/priority |
| Assignment | Manual **Generate** on Quests tab; fixed slice from pool; pool quests **0 XP** on complete (recent) |
| AI | `analyze-quest` classifies difficulty/category; not used for daily mix |
| Statuses | `active` \| `completed` \| `failed` only |
| Briefing | Auto modal on login; empty state says “generate from Quests tab” |
| Streak | Daily complete only; reset on load if yesterday missed |
| Assessment | Skill-arc exams in Vault only |
| Schedule | No 05:00 job |

---

## Capacity model (not a literal task count)

### What we optimize for

- **Target starting pack**: about **3 assignments per day** (soft goal, not a hard “always 3 rows”).
- **Adaptive ceiling**: increases slowly when the hunter **breezes** through recent dailies (high completion, on-time, no extension abuse). Decreases if they struggle.
- **Actual count each day**: whatever fits **remaining budget points** after carryovers — often 1–3, sometimes fewer.

### Difficulty budget (primary lever)

Each quest gets **load points** at assign time (constants file, tunable):

| Difficulty | Base points |
|------------|-------------|
| easy | 1 |
| medium | 2 |
| hard | 4 |
| legendary | 6 |
| learning (+ exam) | +2 on top of base |

**Daily budget** = points available today (not “N tasks”):

- Start from **bandwidth** (one-time picker): Light / Normal / Push → different **starting point budgets** (e.g. low / medium / high point pools — exact numbers in constants only).
- **Behavior tuning** over last ~14 days: completion rate, extension denials, grace usage → nudge budget ±1 step (bounded).
- **Breeze detection**: if completion ≥ threshold for X days → raise **max task slots** or budget slightly (small steps; cap in constants).

**Packing algorithm**: greedy fill — carryovers first → mandatory dropped → high-priority pool → AI suggestions — stop when `sum(points) ≤ todayBudget`. One hard quest can mean **only 1 assignment** even if ceiling allows 3.

### Optional later

- AI bandwidth interview (deferred). Light/Normal/Push + behavior is enough for MVP.

---

## Daily mix (pool + AI)

At **05:00**, for each user (idempotent per `assigned_date`):

1. Close yesterday (grace, expire, penalties, pool `last_outcome` updates).
2. Build **carryover list** (mandatory incomplete, approved extensions, dropped preference candidates).
3. Compute **todayBudget** (points).
4. Classify candidates (`analyze-quest` or cached snapshot).
5. Call **`assign-daily-quests`** edge with:
   - `hunter_vision` / goals (profile text)
   - Skills + levels
   - Pool rows (title, context, mandatory, priority, kind)
   - Carryovers + **remaining points**
   - Instruction: **do not exceed budget**; prefer dropped/mandatory IDs; typical pack **~3** when difficulty allows
6. Insert quest rows.

**Per-day variation**: all pool / mixed pool+AI / fewer tasks when difficulty high — all inside the same budget.

---

## Weekly quests

- Separate **weekly point budget** (larger than daily; constants only).
- Provision on **week start** (e.g. Monday 05:00, same job or sibling).
- AI can split learning pool items (“learn PostgreSQL”) into weekly slices.
- Unfinished weekly slices **carry into next week’s budget** (same anti-bombard rule as daily).
- Learning weeklies: assessment before weekly `due_date` (exact rule TBD in Phase 6).

---

## 05:00 provisioning

**Primary**: Supabase **pg_cron** + edge `provision-daily-quests` (service role, per-user timezone when available).

Per user:

1. `closeDay(yesterday)`
2. `buildCarryovers()`
3. `computeTodayBudget()`
4. `assignDailyQuests()`
5. `assignWeeklyQuests()` when due
6. Set `last_daily_provision_at`

**Safety net (MVP)**: on login, if today has no provision → run same pipeline once (document as fallback until cron is live). User-facing copy still assumes **ready at login**, not “processing now.”

---

## Quest kinds & rewards

| Kind | Mark done | Assessment | Profile XP |
|------|-----------|------------|------------|
| **execution** | Completes quest | None | On complete (`addXP`) |
| **learning** | Opens assessment window | Same calendar day | Only on pass (or AI partial after fail) |

No AI verification for execution (“update X system”) — honor system.

---

## Lifecycle & outcomes

### Statuses (migration)

Extend beyond `active | completed | failed`, e.g.:

- `active` — assigned, in progress
- `incomplete` — submitted reason, awaiting AI
- `extended` — AI approved; new due / grace window
- `assessment_pending` — learning: work marked done, exam not passed yet
- `completed` / `failed` / `expired`

(Alternatively `lifecycle_stage` + `status` — pick one enum model in implementation.)

### Actions

| Action | Execution | Learning |
|--------|-----------|----------|
| Start (optional) | `started_at` | same |
| Done | → completed + XP | → assessment_pending, no XP yet |
| Fail | → failed + smaller penalty | same |
| Incomplete + reason | → AI judge | same |

### AI: incomplete reason (required)

Edge `judge-incomplete-reason`:

- Input: quest, reason, streak, history
- Output: `{ solid, extensionHours?, note }`
- **Solid** → extension, **no penalty at grant**; finish inside window preserves streak
- **Weak** → penalty or fail path
- **Extension limits**: e.g. one extension per quest per assignment period (prevent infinite extensions)
- **Extension counts toward tomorrow’s budget** (not a free extra task)

### Penalties (constants — tune later)

| Outcome | Streak | XP |
|---------|--------|-----|
| **expired** (never started / grace ended) | break / pause | highest |
| **failed** (attempted) | softer | lower |
| incomplete denied | hurts rate | medium |
| completed / pass | credit | reward |

### Leniency

If recent performance good (streak + completion rate):

- Dailies can remain actionable until **~08:00 next morning** (`grace_until`) instead of strict midnight.
- Earned, not default.

---

## Mandatory vs optional (task pool)

**On pool create:**

- `mandatory` (boolean) — real-life work that must eventually be **done**
- `priority` (`normal` | `high`)
- `quest_kind` (`execution` | `learning`) optional; else infer from AI `category`

**Rules:**

| Flag | Not successfully done |
|------|------------------------|
| **mandatory** | Recycled into future dailies/weeklies until **completed** (execution) or **completed + assessment passed** (learning) |
| **optional** | Return to pool; higher pick priority if dropped/failed/expired |

Successful completion removes from mandatory rotation. Mandatory still respects **daily budget** — may be the only assignment that day if points are high.

---

## Data model changes

### `profile`

- `quest_bandwidth` — `light` \| `normal` \| `push` (default `normal`)
- `hunter_vision` / `hunter_goals` (text)
- `quest_timezone` (IANA)
- `last_daily_provision_at` (timestamptz)
- optional `daily_budget_points_override` (null = computed)

### `task_pool`

- `mandatory`, `priority`, `quest_kind`
- `last_outcome`, `last_assigned_at`, `drop_count`

### `quests`

- `quest_kind`, `load_points`
- `started_at`, `incomplete_reason`, `incomplete_ai_verdict` (jsonb)
- `extension_count`, `extended_from_quest_id`, `grace_until`
- `assessment_status`, `assessment_snapshot`
- `source_type`: add `ai_generated`

### `quest_log`

- Outcomes: `incomplete`, `expired`, `extended`, `assessment_pass`, `assessment_fail` (append-only)

### Optional

- `quest_assessments` or attempts table if history needed

---

## Edge functions

| Function | Role |
|----------|------|
| `provision-daily-quests` | Cron entry: close day + assign per user |
| `assign-daily-quests` | AI proposes pack within budget |
| `judge-incomplete-reason` | Solid reason / extension |
| `quest-assessment-generate` | Learning exam questions |
| `grade-quest-assessment` | Pass/fail + partial XP hint |
| `analyze-quest` | Existing — classify candidates at assign |

---

## App architecture (`.cursorrules`)

```
src/constants/questBudget.js      ← ALL numeric caps/budgets (start ~3 slot goal, no magic numbers elsewhere)
src/constants/questLifecycle.js
src/constants/questPenalties.js
src/utils/questBudget.js
src/utils/questAssignment.js
src/services/questProvisionService.js
src/services/questCarryoverService.js
src/services/questAssignmentService.js
src/services/questCloseDayService.js
src/services/questIncompleteService.js
src/services/questAssessmentService.js
src/services/questRewardService.js   ← only path to addXP for quests
```

Chain: **component → hook → service → Supabase / edge**. XP via `addXP` only.

---

## UI

### Profile (home)

- Button: **View today’s directives** → `DailyQuestBriefingModal`
- Auto gate: **“Daily quests are ready”**
- One-time **Light / Normal / Push**
- **Hunter vision** textarea (AI input)

### Remove / hide

- Primary **Generate** on Quests tab (dev flag only if needed)
- Manual “Request system transmission”

### Quest card

- Execution: Complete | Fail | Incomplete (reason)
- Learning: Done → Assessment modal; XP only after pass
- Badges: mandatory, carryover, load points
- XP shown for execution rewards only when non-zero

### Task pool form

- mandatory, priority, optional kind

---

## Build order

| Step | Deliverable |
|------|-------------|
| **1** | Migration + `questBudget.js` + pure budget/carryover utils |
| **2** | Close-day + mandatory recycle + carryover (RPC/manual trigger) |
| **3** | `provision-daily-quests` + cron 05:00 (+ login fallback) |
| **4** | `assign-daily-quests` + pool packer (~3 soft target, budget-driven count) |
| **5** | Briefing copy + profile button + bandwidth picker |
| **6** | Execution complete/fail + XP + streak |
| **7** | Incomplete + `judge-incomplete-reason` + extension in budget |
| **8** | Learning assessment generate/grade + XP gate |
| **9** | Leniency `grace_until` |
| **10** | Weekly provision + learning splits |

---

## Decisions (locked)

1. **Timezone** — `Africa/Lagos` (UTC+1) on profile; default in migration.
2. **Extension row model** — same quest row + `extension_count`.
3. **Learning weekly assessment** — before `due_date` end.
4. **Cron vs fallback** — `QuestProvisionGate` on login + optional pg_cron (see `20260526_quest_provision_cron_note.sql`).
5. **Single user** — no multi-tenant cron scaling needed.

---

## Success criteria

- [x] Login provisions dailies (`QuestProvisionGate`) without manual Generate
- [x] Budget-driven pack (~3 soft target via `QUEST_SOFT_DAILY_SLOT_TARGET` + points)
- [x] Behavior/breeze tuning in `computeDailyBudgetPoints`
- [x] Carryovers consume budget first
- [x] Mandatory pool recycles via `buildDailyCarryovers`
- [x] Execution done → XP; learning → assessment → pass → XP
- [x] Incomplete → `judge-incomplete-reason` edge (AI required)
- [x] Leniency grace until 08:00 when streak/completion qualify
- [ ] Deploy edge functions + run migration `20260526_quest_system_v3.sql`
- [ ] Optional: pg_cron at 05:00 (`20260526_quest_provision_cron_note.sql`)

---

## Out of scope (later)

- AI bandwidth interview
- Proof/verification for execution tasks
- Push at 05:00
- Per-user cron at very large scale (start simple TZ) - just one user -  me, so no worries about this

---

*Last updated: quest design conversation — adaptive ~3/day, difficulty budget, 05:00 provision.*
