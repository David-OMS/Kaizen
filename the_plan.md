
STACK

Vite + React (PWA) — no Next.js overhead, personal internal tool
Supabase — auth, database, realtime
Tailwind CSS — mobile-first, dark theme (deep navy/black, gold/purple accents)
React Query — all data fetching and cache management. Learn this as you go.(this means this is what i want to learn from this build so you gotta explain properly what youre doing and how youre doing it in this aspect)
date-fns — streak logic, quest resets, days since founding


DATABASE SCHEMA
profile (single row — you)
id, name, title, rank, level, xp, capacity_slots_total,
capacity_slots_used, founding_date, streak_current, streak_best
skills
id, name, description, unlocked, unlocked_at
clients
id, name, project_name, status [active|pending|proposal|lost],
start_date, contract_value, referral_source, notes
reachouts
id, contact_name, company, channel, date_sent,
response_status [no_reply|interested|rejected|ghosted], notes
treasury_income
id, client_id, amount, expected_date, received_date,
status [expected|received|overdue], description
treasury_expenses
id, category, amount, date, description
task_pool
id, title, context_note, type [daily_eligible|weekly_eligible|both],
linked_client_id, created_at, times_assigned
quests
id, task_pool_id, title [snapshot], period [daily|weekly],
assigned_date, due_date, status [active|completed|failed],
xp_reward, xp_penalty, completed_at
quest_log (append-only, permanent)
id, quest_id, title, period, outcome [completed|failed],
xp_delta, logged_at
xp_log
id, event_type, description, amount, created_at
contacts
id, name, company, role, warmth [cold|warm|hot],
last_interaction_date, notes
achievements
id, title, description, xp_reward, unlocked, unlocked_at,
manually_awarded, manual_date_override
locked_content
id, type [feature|market|skill|client_type], title,
description, unlocked, unlocked_at
intel_board
id, type [idea|research|opportunity], title, body, created_at
monthly_reviews
id, month, year, content, created_at

RANK + XP SYSTEM
E Rank      0 – 499 XP        "Registered Entity"
D Rank      500 – 1,499 XP    "Hunter"
C Rank      1,500 – 3,499 XP  "System Architect"
B Rank      3,500 – 6,999 XP  "Field Operator"
A Rank      7,000 – 12,999 XP "Guild Leader"
S Rank      13,000+ XP        "Shadow Monarch"
XP events:
Reachout sent              +10
Proposal sent              +25
Client signed              +200
Invoice paid               +75
Rejection received         +15   ← reward, not punishment
Daily quest completed      +30
Weekly quest completed     +80
Daily quest failed         -20
Weekly quest failed        -50
Achievement unlocked       +varies
Monthly review logged      +40
New skill unlocked         +100
Rank gate rule: XP threshold + milestone check. D→C requires at least 2 clients ever signed, not just XP. Gates defined per rank.

ACHIEVEMENT TRIGGERS (starting set)
"First Blood"          → first client signed
"Open Account"         → first invoice received
"The Grind Begins"     → 10 reachouts sent
"100 Rejections"       → 100 rejections logged
"Full Capacity"        → all slots filled simultaneously
"Consistent"           → 7-day daily streak
"Month One"            → first monthly review logged
"Dual Wielding"        → 2 active clients simultaneously
"Backfilled"           → first manually awarded achievement (meta)
Achievements support manually_awarded + manual_date_override for backfilling your history from before the app existed.



PHASES

PHASE 1 — Shell + Hunter Profile
What you're building:
App shell and the character card. This is the face of the whole system.
Includes:

Supabase project setup
Auth (email/password — just you)
Vite + React + Tailwind + React Query configured
PWA manifest and service worker (basic — just so it's installable from day one)
Mobile bottom tab bar navigation + desktop sidebar (build both now, switch with Tailwind breakpoint)
Hunter Profile page:

Name, current title, rank badge
Level + XP bar with progress to next rank
Current streak + best streak
Days since founding date
Capacity meter (slots used / total)
Skills grid (locked/unlocked cards)



Prompt to give your AI:

"Build a Solo Levelling-themed solo founder dashboard as a mobile-first PWA using Vite + React + Tailwind + Supabase + React Query. Dark theme: deep navy/black background, gold and purple accents. Single user auth via Supabase email/password. Mobile-first always — default styles are for 390px, md: for desktop. Navigation is a bottom tab bar on mobile and a sidebar on desktop. Start with Phase 1 only: app shell and the Hunter Profile page. Profile pulls from a single-row profile table in Supabase and displays: rank badge, level, XP bar with progress to next rank, current streak, best streak, days since founding date, capacity meter (slots used / total), and a skills grid showing locked and unlocked skill cards. Do not build any other pages."


PHASE 2 — The Field (Clients + Reachouts + Pipeline)
What you're building:
Everything about who you're talking to and who you're working with.
Includes:

Clients page: list with status filter tabs (Active / Pending / Proposal / Lost), add/edit client form, contract value display
Reachouts page: log a new reachout, response status update, running rejection counter displayed as a prominent trophy stat
Proposals tracked as clients with proposal status — no separate table
XP fires on: reachout sent (+10), proposal sent (+25), client signed (+200), rejection logged (+15)
Capacity slots recalculates live from active client count


PHASE 3 — Treasury
What you're building:
The money view. Clean, not complex.
Includes:

Income list: per entry — client linked, amount, expected date, received date, status
Expenses list: category, amount, date, description
Monthly summary card: income received vs expected, expenses total, net
Revenue target vs actual progress bar (target set on profile)
Outstanding invoices flagged clearly
No XP events in this phase except invoice paid (+75) already defined


PHASE 4 — Task Pool + Quest System
What you're building:
The daily/weekly quest engine. The core gamification mechanic.
Includes:

Task pool page: add anything as it pops into your head, tag it daily/weekly/both, optionally link to a client
Daily quest board: "Generate Today's Quests" button pulls N tasks from pool (random or by insertion order — your choice at generation time)
Weekly quest board: same logic, Monday–Sunday window
Each quest card: title, XP reward shown, Complete / Fail buttons
On complete: XP added, logged to xp_log and quest_log, streak checked
On fail: XP deducted, logged permanently — no editing, no deleting
Streak updates on page load
Quest log page: full permanent history, filterable


PHASE 5 — Gamification Layer
What you're building:
The rank, achievement, and unlock system. This is where it starts feeling like the game.
Includes:

Achievement vault page: locked/unlocked cards, auto-trigger checks on key events, manual award with date override for backfilling
Locked content board: grid of locked cards, unlock on rank or milestone
XP log page: full event history, filterable by type
Rank-up check on every XP event — if threshold crossed and milestone gates pass, trigger rank-up (flash animation, title update, unlock any rank-gated locked content)
"Backfilled" meta-achievement auto-awarded on first manual achievement grant


PHASE 6 — Guild Log + Intel Board
What you're building:
Relationship tracking and the idea/opportunity inbox.
Includes:

Contacts page: add contact, warmth indicator (Cold / Warm / Hot), last interaction date, notes
"Due for contact" flag on anyone not touched in 30+ days
Intel board: add ideas, research notes, opportunities — filter by type
Monthly review log: one entry per month, simple rich text, +40 XP on submission


PHASE 7 — Polish + Deferred Features (don't think about this yet)

PWA push notifications (daily quest reminder, streak warning)
Auto-assign quests at midnight via Supabase Edge Function + cron
Data export per table (CSV)
Full desktop layout refinement
Any missing mobile polish