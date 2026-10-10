import { useEffect, useState } from 'react'
import { TrendingUp, Clock, AlertTriangle, Info } from 'lucide-react'
import { getStats } from '../../services/api'
import type { Stats } from '../../types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const COLORS = ['#43D9A3', '#FF4D5E', '#F5B942', '#8B5CF6', '#B69AFF', '#7C3AED']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: e } = await getStats()
      if (data) setStats(data)
      else setError(e ?? 'Failed to load stats')
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-24 gap-3">
        <AlertTriangle size={32} className="text-threat" />
        <p className="text-text-secondary">{error}</p>
      </div>
    )
  }

  if (!stats || stats.total_events === 0) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-text-main mb-6">Analytics</h1>
        <div className="card flex flex-col items-center py-20 text-center">
          <TrendingUp size={40} className="text-text-secondary opacity-30 mb-4" />
          <p className="text-text-secondary font-medium">No data yet</p>
          <p className="text-sm text-text-secondary/60 mt-1">
            Analyze audio recordings to generate charts and statistics.
          </p>
        </div>
      </div>
    )
  }

  const kindData = Object.entries(stats.by_kind).map(([name, value]) => ({ name, value }))
  const nameData = Object.entries(stats.by_name)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))

  const ChartTooltipStyle = {
    contentStyle: {
      background: '#100D17',
      border: '1px solid rgba(190,160,255,0.15)',
      borderRadius: 8,
      fontSize: 12,
      color: '#F7F4FC',
    },
    itemStyle: { color: '#A49AAF' },
    labelStyle: { color: '#F7F4FC' },
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">
          Aggregated intelligence from your acoustic monitoring sessions.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-2xl font-bold text-text-main">{stats.total_events}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Events</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-threat">{stats.alerts_today}</p>
          <p className="text-xs text-text-secondary mt-0.5">Alerts Today</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-success">{stats.by_kind?.['Bird'] ?? 0}</p>
          <p className="text-xs text-text-secondary mt-0.5">Bird Events</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-warning">{stats.by_kind?.['Threat'] ?? 0}</p>
          <p className="text-xs text-text-secondary mt-0.5">Threat Events</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="card">
          <h2 className="font-semibold text-text-main mb-4">Events by Kind</h2>
          {kindData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={kindData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                    {kindData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...ChartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#A49AAF' }} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <DataUnavailable />
          )}
        </div>

        {/* Bar by name */}
        <div className="card">
          <h2 className="font-semibold text-text-main mb-4">Top Detections</h2>
          {nameData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nameData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#A49AAF' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#A49AAF' }} width={90} />
                <Tooltip {...ChartTooltipStyle} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <DataUnavailable />
          )}
        </div>
      </div>

      {/* Last event */}
      {stats.last_event_at && (
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-primary/20 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-violet-lavender" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-main">Last event recorded</p>
            <p className="text-xs text-text-secondary">
              {new Date(stats.last_event_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
            </p>
          </div>
        </div>
      )}

      {/* Backend report disclaimer */}
      <div className="card border-[rgba(190,160,255,0.08)] flex items-start gap-3">
        <Info size={16} className="text-violet-lavender shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Charts above reflect only the data returned by the backend API. Trend analysis over time requires additional backend endpoints not yet implemented.
          All statistics are scoped to your officer account.
        </p>
      </div>
    </div>
  )
}

function DataUnavailable() {
  return (
    <div className="h-52 flex items-center justify-center text-text-secondary text-sm">
      Not enough data
    </div>
  )
}
