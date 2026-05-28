import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { SapienHabitForm } from '@/components/sapien/SapienHabitForm'
import { SapienHabitRow } from '@/components/sapien/SapienHabitRow'
import { SapienProfileCard } from '@/components/sapien/SapienProfileCard'
import { useProfile } from '@/hooks/useProfile'
import { useSapienMutations, useSapienToday } from '@/hooks/useSapienHabits'

export function SapienDashboard() {
  const profileQuery = useProfile()
  const todayQuery = useSapienToday()
  const { claim } = useSapienMutations()

  if (profileQuery.isLoading || todayQuery.isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-32 rounded-sm border border-[#1E2530] bg-[#12161D]" />
        <Skeleton className="h-24 rounded-sm border border-[#1E2530] bg-[#12161D]" />
      </section>
    )
  }

  if (profileQuery.isError || todayQuery.isError) {
    return (
      <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
        <AlertTitle>Load failed</AlertTitle>
        <AlertDescription>
          {(profileQuery.error || todayQuery.error)?.message ?? 'Could not load Sapien data.'}
        </AlertDescription>
      </Alert>
    )
  }

  const rows = todayQuery.data?.rows ?? []

  return (
    <section className="space-y-4">
      <SapienProfileCard profile={profileQuery.data} />

      <p className="text-center text-[10px] tracking-wider text-zinc-500 uppercase">
        Work block → switch to Hunter
      </p>

      <div>
        <p className="mb-2 text-[10px] tracking-[0.14em] text-[#A855F7] uppercase">Today</p>
        {!rows.length ? (
          <p className="text-sm text-zinc-500">Nothing due today. Add habits or check day schedule.</p>
        ) : (
          <div className="space-y-2">
            {rows.map(({ habit, progress }) => (
              <SapienHabitRow
                key={habit.id}
                habit={habit}
                progress={progress}
                isClaiming={claim.isPending}
                onClaim={(h) => claim.mutate(h)}
              />
            ))}
          </div>
        )}
      </div>

      <SapienHabitForm />
    </section>
  )
}
