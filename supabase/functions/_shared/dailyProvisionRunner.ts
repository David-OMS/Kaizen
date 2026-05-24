import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const TZ_DEFAULT = 'Africa/Lagos'
const OPEN = ['active', 'extended', 'incomplete', 'assessment_pending']
const LOAD: Record<string, number> = { easy: 1, medium: 2, hard: 4, legendary: 6 }
const BANDWIDTH_DAILY: Record<string, number> = { light: 4, normal: 6, push: 8 }
const PENALTY_DAILY_EXPIRED = -25

function formatDbError(error: { message?: string; code?: string; hint?: string; details?: string }) {
  return new Error(
    [error.code, error.message, error.details, error.hint].filter(Boolean).join(' | ') || 'Database error',
  )
}

async function assertQuestSchema(supabase: SupabaseClient) {
  const { error } = await supabase.from('quests').select('quest_kind, carryover, assessment_status').limit(1)
  if (error) throw formatDbError(error)
}

function ymdInTz(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date,
  )
}

function yesterdayYmd(timeZone: string): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return ymdInTz(timeZone, d)
}

function loadPoints(difficulty: string, questKind: string): number {
  const base = LOAD[difficulty] ?? 2
  return base + (questKind === 'learning' ? 2 : 0)
}

function dailyBudget(profile: Record<string, unknown>, logs: { outcome: string }[]): number {
  const bw = String(profile.quest_bandwidth || 'normal')
  const base = BANDWIDTH_DAILY[bw] ?? 6
  if (!logs.length) return Math.min(12, Math.max(3, base))
  const ok = logs.filter((l) => l.outcome === 'completed' || l.outcome === 'assessment_pass').length
  const rate = ok / logs.length
  const adj = rate >= 0.85 ? 1 : rate < 0.4 ? -1 : 0
  const override = profile.daily_budget_points_override
  if (override != null && Number.isFinite(Number(override))) {
    return Math.min(12, Math.max(3, Number(override)))
  }
  return Math.min(12, Math.max(3, base + adj))
}

function sumLoad(items: { loadPoints: number }[]): number {
  return items.reduce((s, i) => s + i.loadPoints, 0)
}

function canFit(packed: { loadPoints: number }[], points: number, cap: number): boolean {
  return sumLoad(packed) + points <= cap
}

function packCandidates(
  carryovers: { loadPoints: number }[],
  pool: { loadPoints: number; mandatory?: boolean; priority?: string; drop_count?: number }[],
  ai: { loadPoints: number }[],
  cap: number,
) {
  const packed: typeof carryovers = []
  const sortPool = [...pool].sort((a, b) => {
    if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    return Number(b.drop_count ?? 0) - Number(a.drop_count ?? 0)
  })
  for (const c of carryovers) {
    if (canFit(packed, c.loadPoints, cap)) packed.push(c)
  }
  for (const t of sortPool) {
    if (canFit(packed, t.loadPoints, cap)) packed.push(t)
  }
  for (const a of ai) {
    if (canFit(packed, a.loadPoints, cap)) packed.push(a)
  }
  return packed
}

async function addXpAdmin(supabase: SupabaseClient, userId: string, amount: number, eventType: string, desc: string) {
  if (!amount) return
  await supabase.from('xp_log').insert({
    user_id: userId,
    amount,
    event_type: eventType,
    description: desc,
  })
  const { data } = await supabase.from('xp_log').select('amount').eq('user_id', userId)
  const total = (data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0)
  await supabase.from('profile').update({ xp: total }).eq('id', userId)
}

async function fetchAiSuggestions(
  supabaseUrl: string,
  serviceKey: string,
  payload: Record<string, unknown>,
): Promise<{ loadPoints: number; title: string; taskPoolId?: string | null; difficulty?: string; questKind?: string; sourceType: string }[]> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/assign-daily-quests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return []
    const body = await res.json()
    return (body.suggestions ?? []).map((s: Record<string, unknown>) => {
      const difficulty = String(s.difficulty || 'medium')
      const questKind = String(s.questKind || (s.category === 'learning' ? 'learning' : 'execution'))
      return {
        title: String(s.title || 'System directive'),
        taskPoolId: (s.taskPoolId as string) || null,
        difficulty,
        questKind,
        loadPoints: Number(s.loadPoints) || loadPoints(difficulty, questKind),
        sourceType: 'ai_generated',
      }
    })
  } catch {
    return []
  }
}

export async function runDailyProvisionForUser(
  supabase: SupabaseClient,
  userId: string,
  opts: { force?: boolean; supabaseUrl: string; serviceKey: string },
) {
  await assertQuestSchema(supabase)

  const { data: profile, error: pErr } = await supabase.from('profile').select('*').eq('id', userId).single()
  if (pErr) throw formatDbError(pErr)
  if (!profile) throw new Error('Profile not found')

  const tz = String(profile.quest_timezone || TZ_DEFAULT)
  const today = ymdInTz(tz)
  const yesterday = yesterdayYmd(tz)

  const { data: todayQuests } = await supabase
    .from('quests')
    .select('id')
    .eq('user_id', userId)
    .eq('period', 'daily')
    .eq('assigned_date', today)

  if (!opts.force && (todayQuests?.length ?? 0) > 0) {
    return { skipped: true, reason: 'already_provisioned', today }
  }

  const since = new Date()
  since.setDate(since.getDate() - 14)
  const { data: logs } = await supabase
    .from('quest_log')
    .select('outcome')
    .eq('user_id', userId)
    .gte('logged_at', since.toISOString())

  const budget = dailyBudget(profile, logs ?? [])

  const { data: yQuests } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('period', 'daily')
    .eq('assigned_date', yesterday)

  const { data: poolRows } = await supabase.from('task_pool').select('*').eq('user_id', userId)
  const poolById = Object.fromEntries((poolRows ?? []).map((t) => [t.id, t]))

  for (const q of yQuests ?? []) {
    if (!OPEN.includes(q.status)) continue
    const graceUntil = q.grace_until ? new Date(q.grace_until) : null
    if (graceUntil && graceUntil > new Date()) continue

    const { error: expErr } = await supabase
      .from('quests')
      .update({ status: 'expired', completed_at: new Date().toISOString() })
      .eq('id', q.id)
    if (expErr) throw formatDbError(expErr)

    const { error: logErr } = await supabase.from('quest_log').insert({
      user_id: userId,
      quest_id: q.id,
      title: q.title,
      period: 'daily',
      outcome: 'expired',
      xp_delta: PENALTY_DAILY_EXPIRED,
    })
    if (logErr) throw formatDbError(logErr)
    await addXpAdmin(supabase, userId, PENALTY_DAILY_EXPIRED, 'daily_quest_failed', `Daily quest expired: ${q.title}`)

    if (q.task_pool_id) {
      const row = poolById[q.task_pool_id]
      await supabase
        .from('task_pool')
        .update({
          last_outcome: row?.mandatory ? 'dropped' : 'expired',
          drop_count: row?.mandatory ? row.drop_count : Number(row?.drop_count ?? 0) + 1,
        })
        .eq('id', q.task_pool_id)
    }
  }

  const carryovers: Record<string, unknown>[] = []
  for (const q of yQuests ?? []) {
    const done = q.status === 'completed' && (q.quest_kind !== 'learning' || q.assessment_status === 'passed')
    if (done) continue
    const poolRow = q.task_pool_id ? poolById[q.task_pool_id] : null
    if (!poolRow?.mandatory && ['expired', 'failed'].includes(q.status)) continue
    carryovers.push({
      title: q.title,
      taskPoolId: q.task_pool_id,
      difficulty: q.difficulty || 'medium',
      questKind: q.quest_kind || 'execution',
      loadPoints: Number(q.load_points) || loadPoints('medium', 'execution'),
      sourceType: q.source_type || 'task_pool',
      carryover: true,
      mandatory: poolRow?.mandatory,
    })
  }

  const usedIds = new Set(carryovers.map((c) => c.taskPoolId).filter(Boolean))
  const poolCandidates: Record<string, unknown>[] = []
  for (const t of poolRows ?? []) {
    if (!['daily_eligible', 'both'].includes(t.type)) continue
    if (usedIds.has(t.id)) continue
    const questKind = t.quest_kind || 'execution'
    poolCandidates.push({
      id: t.id,
      taskPoolId: t.id,
      title: t.title,
      mandatory: t.mandatory,
      priority: t.priority,
      drop_count: t.drop_count,
      difficulty: 'medium',
      questKind,
      loadPoints: loadPoints('medium', questKind),
      sourceType: 'task_pool',
    })
  }

  const usedCarry = sumLoad(carryovers as { loadPoints: number }[])
  const ai = await fetchAiSuggestions(opts.supabaseUrl, opts.serviceKey, {
    hunterVision: profile.hunter_vision || profile.hunter_goals || '',
    skills: [],
    pool: (poolRows ?? []).map((t) => ({ id: t.id, title: t.title, mandatory: t.mandatory, priority: t.priority })),
    carryovers: carryovers.map((c) => ({ title: c.title, loadPoints: c.loadPoints })),
    remainingBudget: Math.max(0, budget - usedCarry),
    assignedDate: today,
  })

  const packed = packCandidates(
    carryovers as { loadPoints: number }[],
    poolCandidates as { loadPoints: number; mandatory?: boolean; priority?: string; drop_count?: number }[],
    ai,
    budget,
  )

  const dailyReward = 30
  const dailyPenalty = 11
  type Packed = {
    title: string
    taskPoolId?: string | null
    difficulty?: string
    questKind?: string
    loadPoints: number
    sourceType?: string
    carryover?: boolean
  }

  const inserts = (packed as Packed[]).map((item) => ({
    user_id: userId,
    task_pool_id: item.taskPoolId ?? null,
    title: item.title,
    period: 'daily',
    assigned_date: today,
    due_date: today,
    status: 'active',
    xp_reward: item.questKind === 'learning' ? 0 : dailyReward,
    xp_penalty: item.questKind === 'learning' ? 0 : dailyPenalty,
    source_type: item.sourceType || 'task_pool',
    reward_visibility: 'known',
    accepted: true,
    difficulty: item.difficulty || 'medium',
    fear_level: 2,
    quest_kind: item.questKind || 'execution',
    load_points: item.loadPoints,
    carryover: Boolean(item.carryover),
    assessment_status: 'none',
    extension_count: 0,
  }))

  if (inserts.length) {
    const { error: insErr } = await supabase.from('quests').insert(inserts)
    if (insErr) throw formatDbError(insErr)
    for (const item of packed as Packed[]) {
      const pid = item.taskPoolId
      if (!pid) continue
      const row = poolById[pid]
      await supabase
        .from('task_pool')
        .update({
          times_assigned: Number(row?.times_assigned ?? 0) + 1,
          last_assigned_at: new Date().toISOString(),
        })
        .eq('id', pid)
    }
  }

  const { error: rpcErr } = await supabase.rpc('mark_daily_provision', { p_user_id: userId })
  if (rpcErr) {
    await supabase
      .from('profile')
      .update({ last_daily_provision_at: new Date().toISOString() })
      .eq('id', userId)
  }

  return { skipped: false, today, dailyCount: inserts.length, budget }
}

export async function runDailyProvisionAllUsers(
  supabase: SupabaseClient,
  opts: { force?: boolean; supabaseUrl: string; serviceKey: string },
) {
  await assertQuestSchema(supabase)

  const { data: profiles, error } = await supabase.from('profile').select('id')
  if (error) throw formatDbError(error)
  const results = []
  for (const row of profiles ?? []) {
    try {
      results.push({ userId: row.id, ...(await runDailyProvisionForUser(supabase, row.id, opts)) })
    } catch (e) {
      const err = e as Error
      results.push({ userId: row.id, error: err.message ?? String(e) })
    }
  }
  return results
}
