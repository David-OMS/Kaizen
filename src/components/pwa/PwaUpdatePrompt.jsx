import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { Button } from '@/components/ui/button'

const UPDATE_CHECK_MS = 30 * 60 * 1000

export function PwaUpdatePrompt() {
  const [available, setAvailable] = useState(false)
  const [reloading, setReloading] = useState(false)
  const updateSWRef = useRef(null)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    let intervalId = null

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.ready.then((reg) => reg.update().catch(() => {}))
      }
    }

    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setAvailable(true)
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return
        intervalId = window.setInterval(() => registration.update().catch(() => {}), UPDATE_CHECK_MS)
      },
    })

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      if (intervalId != null) window.clearInterval(intervalId)
    }
  }, [])

  const handleReload = async () => {
    setReloading(true)
    try {
      await updateSWRef.current?.(true)
    } finally {
      setReloading(false)
    }
  }

  if (!available) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 rounded-sm border border-[#7DD3FC]/40 bg-[#12161D] p-3 shadow-lg md:left-auto md:right-6 md:max-w-sm">
      <p className="text-xs tracking-wide text-[#7DD3FC] uppercase">Update available</p>
      <p className="mt-1 text-xs text-zinc-400">Reload to get the latest Kaizen build.</p>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          className="system-button flex-1 text-[10px]"
          disabled={reloading}
          onClick={handleReload}
        >
          {reloading ? 'RELOADING…' : 'RELOAD'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[10px] text-zinc-500"
          disabled={reloading}
          onClick={() => setAvailable(false)}
        >
          LATER
        </Button>
      </div>
    </div>
  )
}
