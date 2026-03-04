import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Landing   from './pages/Landing'
import Auth      from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Redirect  from './pages/Redirect'
import NotFound  from './pages/NotFound'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <DropSpinner />
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

function DropSpinner() {
  return (
    <svg className="animate-float w-10 h-12" viewBox="0 0 28 34" fill="none">
      <path d="M14 2C14 2 3 12.5 3 20.5C3 26.85 7.93 32 14 32C20.07 32 25 26.85 25 20.5C25 12.5 14 2 14 2Z" fill="#1a6bff"/>
    </svg>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/auth"      element={<Auth />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        {/* redirect */}
        <Route path="/:code"     element={<Redirect />} />
        {/* catch-all 404 */}
        <Route path="*"           element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
