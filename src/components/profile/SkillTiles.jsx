import { Card, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export function SkillTiles({ skills }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {skills.map((skill) => (
        <Card
          key={skill.id}
          className="system-glitch rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-3"
        >
          <CardContent className="space-y-2 px-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs tracking-[0.09em] text-white uppercase">{skill.name}</p>
              {skill.unlocked ? (
                <span className="text-[10px] tracking-[0.12em] text-[#7DD3FC] uppercase">Unlocked</span>
              ) : (
                <Lock className="size-3 text-zinc-500" strokeWidth={1.8} />
              )}
            </div>
            {skill.skill_type === 'specialty' ? (
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Arc unlock</p>
            ) : null}
            {skill.xp != null && skill.xp > 0 ? (
              <p className="font-mono text-[10px] text-[#A855F7]">
                Skill XP {skill.xp}
                {skill.level != null ? ` · L${skill.level}` : ''}
                {skill.curriculum_tier ? ` · ${skill.curriculum_tier}` : ''}
              </p>
            ) : null}
            <p className="max-h-9 overflow-hidden text-xs text-zinc-400">{skill.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
