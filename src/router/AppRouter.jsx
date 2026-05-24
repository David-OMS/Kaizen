import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { SystemScanlines } from '@/components/layout/SystemScanlines'
import { useAuthSession } from '@/hooks/useAuthSession'
import { FieldPage } from '@/pages/FieldPage'
import { HunterProfilePage } from '@/pages/HunterProfilePage'
import { LoginPage } from '@/pages/LoginPage'
import { QuestsPage } from '@/pages/QuestsPage'
import { TreasuryPage } from '@/pages/TreasuryPage'
import { VaultPage } from '@/pages/VaultPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'

export function AppRouter() {
  const { isAuthenticated } = useAuthSession()

  return (
    <>
      <SystemScanlines />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" replace /> : <LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<HunterProfilePage />} />
          <Route path="/field/*" element={<FieldPage />} />
          <Route path="/treasury" element={<TreasuryPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/vault" element={<VaultPage />} />
        </Route>
      </Routes>
    </>
  )
}