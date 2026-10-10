import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Bird, Zap, TrendingUp, Clock, MapPin } from 'lucide-react'
import { getStats, getEvents, getHealth } from '../../services/api'
import type { Stats, EventRecord, HealthStatus } from '../../types'
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton'
import { EventRow } from '../../components/DetectionComponents'
import { useAuth } from '../../contexts/AuthContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

const VIOLET = '#8B5CF6'
const SUCCESS = '#43D9A3'
const THREAT = '#FF4D5E'
const WARNING = '#F5B942'

export default function DashboardPage() {
  const { officer } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [s, e, h] = await Promise.all([getStats(), getEvents({ limit: 8 }), getHealth()])
      if (s.data) setStats(s.data)
      if (e.data) setEvents(e.data.events)
      if (h.data) setHealth(h.data)
      setLoading(false)
    }
    load()
  }, [])

  const kindData = stats
    ? Object.entries(stats.by_kind).map(([name, value]) => ({ name, value }))
    : []

  const nameData = stats
    ? Object.entries(stats.by_name)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : []

  const COLORS = [SUCCESS, THREAT, WARNING, VIOLET]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main">
          Good {getGreeting()}, {officer?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {officer?.forest_division} · {officer?.forest_range} · Acoustic Intelligence Dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Events"
              value={stats?.total_events ?? 0}
              icon={<Activity size={18} className="text-violet-lavender" />}
              color="violet"
            />
            <StatCard
              label="Alerts Today"
              value={stats?.alerts_today ?? 0}
              icon={<AlertTriangle size={18} className="text-threat" />}
              color="threat"
              highlight={stats?.alerts_today ? stats.alerts_today > 0 : false}
            />
            <StatCard
              label="Bird Detections"
              value={stats?.by_kind?.['Bird'] ?? 0}
              icon={<Bird size={18} className="text-success" />}
              color="success"
            />
            <StatCard
              label="Threat Detections"
              value={stats?.by_kind?.['Threat'] ?? 0}
              icon={<Zap size={18} className="text-warning" />}
              color="warning"
            />
          </>
        )}
      </div>

      {/* Charts + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Events */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(190,160,255,0.08)]">
            <h2 className="font-semibold text-text-main">Recent Events</h2>
            <Link to="/app/events" className="text-xs text-violet-lavender hover:text-violet-bright transition-colors">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="px-5 py-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Activity size={32} className="text-text-secondary" />}
              title="No events yet"
              desc="Events will appear here after you analyze audio recordings."
            />
          ) : (
            <div>
              {events.map(ev => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  onClick={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="font-semibold text-text-main mb-4">Detection Distribution</h2>
          {loading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : kindData.length === 0 ? (
            <EmptyState
              icon={<TrendingUp size={28} className="text-text-secondary" />}
              title="No data"
              desc="Distribution will appear once events are recorded."
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={kindData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {kindData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#100D17', border: '1px solid rgba(190,160,255,0.15)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#F7F4FC' }}
                    itemStyle={{ color: '#A49AAF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                {kindData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Name breakdown chart */}
      {!loading && nameData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-text-main mb-4">Events by Detection Name</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={nameData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A49AAF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A49AAF' }} />
              <Tooltip
                contentStyle={{ background: '#100D17', border: '1px solid rgba(190,160,255,0.15)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#F7F4FC' }}
                itemStyle={{ color: '#A49AAF' }}
              />
              <Bar dataKey="value" fill={VIOLET} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status + last event */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-text-main mb-3">System Health</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
            </div>
          ) : health ? (
            <div className="space-y-2">
              <HealthRow label="ML Model" ok={health.model_loaded} detail={health.model_error ?? undefined} />
              <HealthRow label="FFmpeg" ok={health.ffmpeg_ok} />
              <HealthRow label="SMTP" ok={health.smtp_configured} detail={!health.smtp_configured ? 'Email alerts disabled' : undefined} />
              <HealthRow label="Dev Mode" ok={!health.dev_mode} detail={health.dev_mode ? 'Production mode off' : undefined} />
            </div>
          ) : (
            <p className="text-text-secondary text-sm">Unable to reach backend</p>
          )}
        </div>

        {stats?.last_event_at && (
          <div className="card">
            <h2 className="font-semibold text-text-main mb-3">Latest Activity</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-primary/20 flex items-center justify-center">
                <Clock size={18} className="text-violet-lavender" />
              </div>
              <div>
                <p className="text-sm text-text-main">Last event recorded</p>
                <p className="text-xs text-text-secondary">
                  {new Date(stats.last_event_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, highlight }: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'violet' | 'threat' | 'success' | 'warning'
  highlight?: boolean
}) {
  const borders = {
    violet: 'hover:border-violet-primary/40',
    threat: highlight ? 'border-[rgba(255,77,94,0.3)]' : 'hover:border-threat/30',
    success: 'hover:border-success/30',
    warning: 'hover:border-warning/30',
  }
  return (
    <div className={`stat-card ${borders[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        {highlight && value > 0 && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-threat opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-threat" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-main">{value.toLocaleString()}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

function HealthRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-text-secondary">{detail}</span>}
        <span className={`text-xs font-medium ${ok ? 'text-success' : 'text-threat'}`}>
          {ok ? 'OK' : 'Issue'}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-success' : 'bg-threat'}`} />
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <p className="text-xs text-text-secondary/60 mt-1 max-w-xs">{desc}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
