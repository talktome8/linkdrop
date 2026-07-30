import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Dashboard from './Dashboard'

export default function DashboardRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-label="Loading">
        <svg className="animate-float w-10 h-12" viewBox="0 0 28 34" fill="none">
          <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff" />
        </svg>
      </div>
    )
  }

  return user ? <Dashboard /> : <Navigate to="/auth" replace />
}
