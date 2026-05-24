import { Navigate } from 'react-router-dom'
import { useAuthSession } from '@/hooks/useAuthSession'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthSession()

  if (isLoading) {
    return <div className="min-h-svh bg-[#080A0F]" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}