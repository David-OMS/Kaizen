import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModalPanel } from '@/components/ui/ModalPanel'
import { Button } from '@/components/ui/button'
import { isSecretAchievementRow } from '@/constants/achievementCatalog'
import { useAchievements, useManualAwardAchievement } from '@/hooks/useAchievements'

function ManualAwardForm({ achievement, onSubmit, isPending }) {
  const [manualDateOverride, setManualDateOverride] = useState(new Date().toISOString().slice(0, 10))

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit({ id: achievement.id, manualDateOverride })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <p className="text-sm text-zinc-300">
        Manual award for <span className="text-white">{achievement.title}</span>
      </p>
      <div className="space-y-2">
        <label htmlFor="manual-date" className="text-[10px] tracking-[0.1em] text-[#7DD3FC] uppercase">
          Date Override
        </label>
        <input
          id="manual-date"
          type="date"
          value={manualDateOverride}
          onChange={(event) => setManualDateOverride(event.target.value)}
          className="h-10 w-full rounded-[2px] border border-[#1E2530] bg-transparent px-2 text-sm"
        />
      </div>
      <Button type="submit" className="system-button w-full text-[10px]" disabled={isPending}>
        {isPending ? 'AWARDING...' : 'MANUAL AWARD'}
      </Button>
    </form>
  )
}

function AchievementVaultRow({ achievement, onManualAward }) {
  const secret = isSecretAchievementRow(achievement)
  const locked = !achievement.unlocked
  const mystery = secret && locked
  const displayTitle =
    mystery || achievement.title === 'Undiscovered' ? '???' : achievement.title

  return (
    <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
      <CardHeader className="px-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm tracking-[0.12em] text-[#7DD3FC] uppercase italic">
            {displayTitle}
          </CardTitle>
          <span className="rounded-sm border border-[#1E2530] px-2 py-1 text-[10px] text-zinc-200 uppercase">
            {achievement.unlocked ? 'unlocked' : mystery ? 'undiscovered' : 'locked'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 text-sm text-zinc-300">
        <p>{mystery ? 'The System has not revealed this yet.' : achievement.description || '—'}</p>
        {!mystery ? <p>XP Reward: {achievement.xp_reward}</p> : null}
        {achievement.unlocked_at ? (
          <p>Unlocked: {new Date(achievement.unlocked_at).toLocaleString()}</p>
        ) : null}
        <Button type="button" className="system-button text-[10px]" onClick={() => onManualAward(achievement)}>
          Manual Award
        </Button>
      </CardContent>
    </Card>
  )
}

export function AchievementVault() {
  const achievementsQuery = useAchievements()
  const manualAward = useManualAwardAchievement()
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  if (achievementsQuery.isLoading) {
    return (
      <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
        <CardContent className="px-4 text-sm text-zinc-300">Loading achievements...</CardContent>
      </Card>
    )
  }

  if (achievementsQuery.isError) {
    return (
      <Card className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8 py-4">
        <CardContent className="px-4 text-sm text-red-100">{achievementsQuery.error.message}</CardContent>
      </Card>
    )
  }

  const achievements = achievementsQuery.data
  const undiscovered = achievements.filter(
    (a) => !a.unlocked && isSecretAchievementRow(a),
  ).length

  return (
    <section className="space-y-3">
      <p className="text-center text-[11px] tracking-[0.12em] text-zinc-500 uppercase">
        {undiscovered > 0
          ? `${undiscovered} hidden record${undiscovered === 1 ? '' : 's'} await discovery`
          : 'All known records uncovered — the System may still hide more'}
      </p>

      {!achievements.length ? (
        <Card className="rounded-sm border border-[#1E2530] bg-[#12161D]/90 py-4">
          <CardContent className="px-4 text-sm text-zinc-300">
            No records yet. Play the field — surprises unlock as you go.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <AchievementVaultRow
              key={achievement.id}
              achievement={achievement}
              onManualAward={setSelectedAchievement}
            />
          ))}
        </div>
      )}

      <ModalPanel
        open={Boolean(selectedAchievement)}
        title="Manual Achievement Award"
        onClose={() => setSelectedAchievement(null)}
      >
        {selectedAchievement ? (
          <ManualAwardForm
            achievement={selectedAchievement}
            isPending={manualAward.isPending}
            onSubmit={async (payload) => {
              await manualAward.mutateAsync(payload)
              setSelectedAchievement(null)
            }}
          />
        ) : null}
      </ModalPanel>
    </section>
  )
}
