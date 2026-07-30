import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing   from './pages/Landing'

const Auth = lazy(() => import('./pages/Auth'))
const DashboardRoute = lazy(() => import('./pages/DashboardRoute'))
const Redirect = lazy(() => import('./pages/Redirect'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
        <Route path="/auth"      element={<LazyRoute><Auth /></LazyRoute>} />
        <Route path="/dashboard" element={<LazyRoute><DashboardRoute /></LazyRoute>} />
        {/* redirect */}
        <Route path="/:code"     element={<LazyRoute><Redirect /></LazyRoute>} />
        {/* catch-all 404 */}
        <Route path="*"           element={<LazyRoute><NotFound /></LazyRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

function LazyRoute({ children }) {
  return <Suspense fallback={<RouteLoader />}>{children}</Suspense>
}

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" aria-label="Loading">
      <DropSpinner />
    </div>
  )
}
