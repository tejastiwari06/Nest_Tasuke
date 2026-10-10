import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastContainer } from './components/ui/Toast'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/auth/RegisterPage'
import LoginPage from './pages/auth/LoginPage'
import AppShell from './pages/app/AppShell'
import DashboardPage from './pages/app/DashboardPage'
import AnalyzePage from './pages/app/AnalyzePage'
import EventsPage from './pages/app/EventsPage'
import MapPage from './pages/app/MapPage'
import AnalyticsPage from './pages/app/AnalyticsPage'
import SettingsPage from './pages/app/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { officer, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-bright border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading session…</span>
        </div>
      </div>
    )
  }
  if (!officer) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { officer, loading } = useAuth()
  if (loading) return null
  if (officer) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          {/* Protected app */}
          <Route path="/app" element={<PrivateRoute><AppShell /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="analyze" element={<AnalyzePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
