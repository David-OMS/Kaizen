# Quest Engine v4 — Reference Plan

Build reference for non-friction task dump → 5am assignment → learning retention.

## Principles

- **Dump now, plan at 5am** while user sleeps.
- **No helper-text clutter** in UI.
- User only sets what only they know; AI/system infers the rest.
- **Deterministic tie-breaks** when AI scores are similar (no daily mood swings).

---

## 1) Task dump UX (minimal)

| Field | Required | Purpose |
|-------|----------|---------|
| Title | yes | What to do |
| Context note | no | Why / goals (feeds AI alignment) |
| Learning vs Execution | yes | Low-friction type signal |
| Must not skip | no | Real external consequence (client blocker) — NOT "I really want to learn" |

**Removed from create form** (inferred at create/update + 5am):

- Type (daily_eligible / weekly_eligible)
- Repeat policy
- Priority
- Weekly target days
- Weekly distribution

**Labels:**

- Checkbox: `Must not skip` (not "Mandatory")
- Context: optional; no tutorial paragraphs

---

## 2) Persisted AI profile per task

On task create/update (and nightly refresh if stale), store:

- `inferred_horizon`: `one_off` | `long_track`
- `inferred_importance` (0–100)
- `goal_alignment_score` (0–100, from profile + context)
- `weekly_target_days` (1–7, long-track only)
- `weekly_distribution_mode`: spread | consecutive | adaptive
- `repeat_policy`: until_completed | always (inferred)
- `type`: daily_eligible | weekly_eligible (inferred)
- `ai_confidence` (0–1)
- `ai_classified_at`

Heuristics when AI fails: learning + long title → weekly + always + 3 days adaptive.

---

## 3) 5am planner pipeline

1. Load task pool.
2. Refresh stale AI classifications (optional batch).
3. **Focus capacity**: compute max simultaneous long-tracks (`repeat_policy = always`, weekly).
4. **Auto-focus**: rank active candidates; set `focus_active=true` for top K; archive rest.
5. **Only evaluate active focus tasks** for weekly scheduling (archived = skip).
6. Close yesterday; build carryovers (`must_not_skip` forces recycle).
7. Build weekly session candidates (debt-based).
8. Build daily pool candidates (daily_eligible one-offs).
9. Pack main quests under daily budget.
10. Generate **recall micro-quests** (separate lane, 0 load).

---

## 4) Deterministic ranking (tie-break)

When scores are similar, sort by:

1. `must_not_skip` (true first)
2. `weekly_debt` (expected sessions by today − assigned this week)
3. `goal_alignment_score` (desc)
4. `inferred_importance` (desc)
5. `days_since_last_assigned` (desc)
6. `times_assigned_this_week` (asc)
7. `created_at` (asc)
8. `task_id` (asc) — stable fallback

---

## 5) Mandatory vs "must learn"

| Intent | User action | System |
|--------|-------------|--------|
| Client will break if skipped | Must not skip ✓ | Daily carryover until done/failed |
| Important long-term learning | Nothing | `always` + focus rotation + debt |
| Random one-off thought | Nothing | daily_eligible, until_completed |

---

## 6) Learning: Battle Intel + assessments

### On learning quest "done"

1. Require **Battle Intel** (short text: what was learned).
2. Store on quest: `battle_intel`, `battle_intel_at`.
3. Generate assessment from **Battle Intel only** (strict prompt).

### Same-day assessment

- Quest → `assessment_pending` → quiz from Battle Intel.

---

## 7) Spaced recall (revision micro-quests)

After learning quest passes assessment:

- Schedule recall rows: D+1, D+3, D+7 (+ optional surprise later).
- Each recall = micro quest (`is_micro=true`, `load_points=0`).
- Quiz generated strictly from source quest's Battle Intel.
- **Not counted** in main daily budget.
- UI: separate **Recall Gate** section (minimal labels, no helper essays).

### Revision load

- No hard cap required for same-day new learning (capacity limits active long-tracks).
- **Smart spread**: avoid piling all due recalls on one day when tomorrow has room; prioritize overdue.

---

## 8) Daily play UX

- **Daily**: main capacity-limited quests.
- **Recall Gate**: micro revision quizzes.
- **Task pool**: dump list; badges `Active` / `Parked` only.
- No planning UI at add time.

---

## 9) Implementation phases

### Phase A (ship first)

- [x] Slim `TaskPoolForm`
- [x] Migration: task AI fields + quest battle_intel + recall tables (`20260605_quest_engine_v4.sql`)
- [x] `classifyAndPersistTaskPool` on create
- [x] Auto-focus at provision (no blocking modal)
- [x] Debt-based weekly candidate sort
- [x] Rename mandatory label → Must not skip

### Phase B

- [x] Battle Intel modal before assessment_pending
- [x] Assessment prompt uses Battle Intel only
- [x] Recall schedule + 5am micro-quest generation
- [x] Recall Gate on quest board

### Phase C (later)

- [ ] Spaced surprise recall beyond D+7
- [ ] Optional swap UI when adding urgent task over focus limit

---

## 10) Assumptions / guards

- Vague titles: context compensates; min Battle Intel length on submit.
- Archived tasks: not scheduled until focus_active.
- AI inconsistency: persist scores; 5am uses stored + deterministic tie-break.
- Profile goals (e.g. ECOWAS): feed `goal_alignment_score` in classification.
