/** Curated tracks — unlocked via XP, arcs, and verification (not free-form lists). */
export const SKILL_TRACK = {
  BUILDER: 'builder',
  FOUNDER: 'founder',
  SPECIALTY: 'specialty',
}

export const SKILL_CATALOG = [
  {
    key: 'backend_engineering',
    track: SKILL_TRACK.BUILDER,
    name: 'Backend Engineering',
    description: 'APIs, auth, data layers, and production-grade server code.',
  },
  {
    key: 'system_design',
    track: SKILL_TRACK.BUILDER,
    name: 'System Design',
    description: 'Architecture, tradeoffs, and patterns that scale.',
  },
  {
    key: 'databases',
    track: SKILL_TRACK.BUILDER,
    name: 'Databases',
    description: 'Modeling, SQL, migrations, and query performance.',
  },
  {
    key: 'devops_delivery',
    track: SKILL_TRACK.BUILDER,
    name: 'DevOps & Delivery',
    description: 'CI/CD, hosting, monitoring, and shipping reliably.',
  },
  {
    key: 'testing_quality',
    track: SKILL_TRACK.BUILDER,
    name: 'Testing & Quality',
    description: 'Tests, debugging, and maintainable codebases.',
  },
  {
    key: 'security',
    track: SKILL_TRACK.BUILDER,
    name: 'Security Basics',
    description: 'Auth, secrets, and practical app security.',
  },
  {
    key: 'product_scope',
    track: SKILL_TRACK.FOUNDER,
    name: 'Product & Scope',
    description: 'MVP judgment, priorities, and cutting scope wisely.',
  },
  {
    key: 'client_delivery',
    track: SKILL_TRACK.FOUNDER,
    name: 'Client Delivery',
    description: 'Deadlines, expectations, and reliable shipping.',
  },
  {
    key: 'pipeline_sales',
    track: SKILL_TRACK.FOUNDER,
    name: 'Pipeline & Outreach',
    description: 'Leads, follow-up, and turning interest into calls.',
  },
  {
    key: 'deals_pricing',
    track: SKILL_TRACK.FOUNDER,
    name: 'Deals & Pricing',
    description: 'Proposals, negotiation, and pricing for value.',
  },
  {
    key: 'public_presence',
    track: SKILL_TRACK.FOUNDER,
    name: 'Public Speaking',
    description: 'Calls, presentations, and showing up with clarity.',
  },
  {
    key: 'money_runway',
    track: SKILL_TRACK.FOUNDER,
    name: 'Money Management',
    description: 'Budget, runway, and pricing your time.',
  },
]

export const SKILL_CATALOG_KEYS = SKILL_CATALOG.map((s) => s.key)
