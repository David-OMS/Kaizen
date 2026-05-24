export const PUSH_TYPES = {
  DAILY_READY: 'daily_ready',
  DAILY_REMINDER: 'daily_reminder',
}

export const PUSH_PAYLOADS = {
  [PUSH_TYPES.DAILY_READY]: {
    title: 'Daily quests are ready',
    body: 'Your directives for today are loaded.',
    tag: 'daily_ready',
    data: { url: '/quests' },
  },
  [PUSH_TYPES.DAILY_REMINDER]: {
    title: 'Quests still open',
    body: 'Finish today’s dailies before penalties hit.',
    tag: 'daily_reminder',
    data: { url: '/quests' },
  },
}
