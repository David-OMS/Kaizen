import { Outlet } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { useSignOut } from '@/hooks/useSignOut'
import { useAuthSession } from '@/hooks/useAuthSession'

export function AppShell() {
  const signOut = useSignOut()
  const { user } = useAuthSession()
  const username = user?.user_metadata?.username ?? user?.email?.split('@')?.[0] ?? 'hunter'

  return (
    <div className="relative min-h-svh bg-[#080A0F] text-white md:flex">
      <DesktopSidebar />

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#1E2530] bg-[#12161D]/80 px-4 py-4 md:px-6">
          <div>
            <h1 className="flex items-center gap-2 text-base font-black tracking-[0.2em] text-[#7DD3FC] uppercase md:text-xl">
              <Zap className="size-5 fill-[#7DD3FC]/20 text-[#7DD3FC]" strokeWidth={2.2} />
              Kaizen
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-zinc-400 md:block">@{username}</p>
            <Button
              type="button"
              className="system-button px-3 py-2 text-[10px]"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              {signOut.isPending ? 'EXITING...' : 'LOG OUT'}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-24 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
    </div>
  )
}