import { SKILL_CATALOG, SKILL_TRACK } from '@/constants/skillCatalog'
import { SkillTiles } from '@/components/profile/SkillTiles'

const TRACK_LABEL = {
  [SKILL_TRACK.BUILDER]: 'Builder',
  [SKILL_TRACK.FOUNDER]: 'Founder',
}

function sortByCatalog(skills, track) {
  const order = SKILL_CATALOG.filter((c) => c.track === track).map((c) => c.key)
  return [...skills].sort(
    (a, b) => order.indexOf(a.catalog_key) - order.indexOf(b.catalog_key),
  )
}

export function SkillsGrid({ skills = [] }) {
  const catalog = skills.filter((s) => s.catalog_key)
  const specialty = skills.filter((s) => s.skill_type === 'specialty' && !s.catalog_key)
  const builder = sortByCatalog(
    catalog.filter((s) => s.skill_type === SKILL_TRACK.BUILDER),
    SKILL_TRACK.BUILDER,
  )
  const founder = sortByCatalog(
    catalog.filter((s) => s.skill_type === SKILL_TRACK.FOUNDER),
    SKILL_TRACK.FOUNDER,
  )

  if (!catalog.length && !specialty.length) {
    return <p className="text-sm text-zinc-500">Loading skills…</p>
  }

  return (
    <div className="space-y-6">
      {builder.length ? (
        <div>
          <p className="mb-2 text-[10px] tracking-[0.14em] text-[#7DD3FC] uppercase">
            {TRACK_LABEL[SKILL_TRACK.BUILDER]}
          </p>
          <SkillTiles skills={builder} />
        </div>
      ) : null}
      {founder.length ? (
        <div>
          <p className="mb-2 text-[10px] tracking-[0.14em] text-[#A855F7] uppercase">
            {TRACK_LABEL[SKILL_TRACK.FOUNDER]}
          </p>
          <SkillTiles skills={founder} />
        </div>
      ) : null}
      {specialty.length ? (
        <div>
          <p className="mb-2 text-[10px] tracking-[0.14em] text-zinc-500 uppercase">Specialty</p>
          <SkillTiles skills={specialty} />
        </div>
      ) : null}
    </div>
  )
}
