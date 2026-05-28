import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'kaizen_app_mode'

export const APP_MODE = {
  HUNTER: 'hunter',
  SAPIEN: 'sapien',
}

const AppModeContext = createContext(null)

function readStoredMode() {
  if (typeof window === 'undefined') return APP_MODE.HUNTER
  const v = localStorage.getItem(STORAGE_KEY)
  return v === APP_MODE.SAPIEN ? APP_MODE.SAPIEN : APP_MODE.HUNTER
}

export function AppModeProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setModeState] = useState(readStoredMode)

  useEffect(() => {
    if (location.pathname.startsWith('/sapien')) {
      setModeState(APP_MODE.SAPIEN)
      localStorage.setItem(STORAGE_KEY, APP_MODE.SAPIEN)
    } else if (location.pathname === '/profile') {
      setModeState(APP_MODE.HUNTER)
      localStorage.setItem(STORAGE_KEY, APP_MODE.HUNTER)
    }
  }, [location.pathname])

  const setMode = useCallback(
    (next) => {
      setModeState(next)
      localStorage.setItem(STORAGE_KEY, next)
      navigate(next === APP_MODE.SAPIEN ? '/sapien' : '/profile', { replace: true })
    },
    [navigate],
  )

  const value = useMemo(
    () => ({
      mode,
      isSapien: mode === APP_MODE.SAPIEN,
      isHunter: mode === APP_MODE.HUNTER,
      setMode,
    }),
    [mode, setMode],
  )

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode() {
  const ctx = useContext(AppModeContext)
  if (!ctx) throw new Error('useAppMode requires AppModeProvider')
  return ctx
}
