import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'

const OPEN = ['active', 'extended', 'incomplete', 'assessment_pending']

const PAYLOADS = {
  daily_ready: {
    title: 'Daily quests are ready',
    body: 'Your directives for today are loaded.',
    tag: 'daily_ready',
    data: { url: '/quests' },
  },
  daily_reminder: {
    title: 'Quests still open',
    body: "Finish today's dailies before penalties hit.",
    tag: 'daily_reminder',
    data: { url: '/quests' },
  },
} as const

function ymdInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function configureVapid() {
  const subject = Deno.env.get('VAPID_SUBJECT')?.trim()
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim()
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim()
  if (!subject || !publicKey || !privateKey) {
    throw new Error('Missing VAPID_SUBJECT, VAPID_PUBLIC_KEY, or VAPID_PRIVATE_KEY')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

async function userIdsNeedingReminder(supabase: SupabaseClient): Promise<Set<string>> {
  const { data: profiles } = await supabase.from('profile').select('id, quest_timezone')
  const tzByUser = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, String(p.quest_timezone || 'Africa/Lagos')]),
  )

  const { data: quests, error } = await supabase
    .from('quests')
    .select('user_id, assigned_date')
    .eq('period', 'daily')
    .in('status', OPEN)

  if (error) throw error

  const need = new Set<string>()
  for (const q of quests ?? []) {
    const tz = tzByUser[q.user_id] || 'Africa/Lagos'
    if (q.assigned_date === ymdInTz(tz)) need.add(q.user_id)
  }
  return need
}

export async function sendQuestPushNotifications(
  supabase: SupabaseClient,
  type: 'daily_ready' | 'daily_reminder',
) {
  configureVapid()
  const payload = PAYLOADS[type]
  const body = JSON.stringify(payload)

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
  if (error) throw error
  if (!subs?.length) return { sent: 0, skipped: 0, type }

  const reminderUsers =
    type === 'daily_reminder' ? await userIdsNeedingReminder(supabase) : null

  let sent = 0
  let skipped = 0

  for (const row of subs) {
    if (reminderUsers && !reminderUsers.has(row.user_id)) {
      skipped += 1
      continue
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        body,
      )
      sent += 1
    } catch (e) {
      const err = e as { statusCode?: number }
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('user_id', row.user_id)
      }
      skipped += 1
    }
  }

  return { sent, skipped, type }
}
