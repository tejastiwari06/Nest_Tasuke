import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Mic, Activity, Map, BarChart3, Settings,
  ChevronLeft, ChevronRight, Bell, LogOut, Menu, X, TreePine
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../components/ui/Toast'

const NAV_ITEMS = [
  { to: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: 'analyze', label: 'Analyze Audio', icon: Mic },
  { to: 'events', label: 'Live Events', icon: Activity },
  { to: 'map', label: 'Forest Map', icon: Map },
  { to: 'analytics', label: 'Analytics', icon: BarChart3 },
  { to: 'settings', label: 'Settings', icon: Settings },
]

export default function AppShell() {
  const { officer, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [])

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[rgba(190,160,255,0.1)] ${collapsed ? 'justify-center' : ''}`}>
        <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-md object-cover shrink-0" />
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-text-main tracking-wide">Nest Tasuke</p>
            <p className="text-[10px] text-violet-lavender font-medium tracking-widest uppercase">Forest AI</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span className="animate-fade-in">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Officer info */}
      {officer && !collapsed && (
        <div className="px-3 py-4 border-t border-[rgba(190,160,255,0.1)] animate-fade-in">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-violet-primary/30 border border-violet-primary/40 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-violet-lavender">
                {officer.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-main truncate">{officer.full_name}</p>
              <p className="text-[11px] text-text-secondary truncate">{officer.designation}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full mt-1 text-xs justify-start">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-2 py-4 border-t border-[rgba(190,160,255,0.1)]">
          <button onClick={handleLogout} className="btn-ghost w-full justify-center p-2" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className="flex h-screen bg-obsidian overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-[rgba(190,160,255,0.1)] bg-elevated relative transition-all duration-300 shrink-0 ${
          collapsed ? 'w-[60px]' : 'w-[220px]'
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-elevated border border-[rgba(190,160,255,0.2)] flex items-center justify-center text-text-secondary hover:text-text-main hover:border-violet-primary transition-all z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-64 bg-elevated border-r border-[rgba(190,160,255,0.15)] flex flex-col animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-main"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-[rgba(190,160,255,0.1)] flex items-center px-4 md:px-6 gap-4 shrink-0 bg-elevated/50">
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {officer && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-text-main">{officer.full_name}</p>
                <p className="text-[11px] text-text-secondary">{officer.forest_division}</p>
              </div>
              <button className="btn-ghost p-2 relative" aria-label="Notifications">
                <Bell size={18} />
              </button>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
