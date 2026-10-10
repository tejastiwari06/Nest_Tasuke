import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, AlertTriangle, RefreshCw, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents, getEvent } from '../../services/api'
import type { EventRecord, EventDetail } from '../../types'
import { EventRow, KindBadge, AlertBadge, ConfidenceBar } from '../../components/DetectionComponents'
import { SkeletonRow } from '../../components/ui/Skeleton'

const PAGE_SIZE = 20

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('')
  const [onlyAlerts, setOnlyAlerts] = useState(false)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<EventDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: e } = await getEvents({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      kind: kindFilter || undefined,
      only_alerts: onlyAlerts,
    })
    if (data) {
      setEvents(data.events)
      setTotal(data.total)
    } else {
      setError(e ?? 'Failed to load events')
    }
    setLoading(false)
  }, [page, kindFilter, onlyAlerts])

  useEffect(() => { load() }, [load])

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    const { data } = await getEvent(id)
    setSelected(data)
    setDetailLoading(false)
  }

  const filtered = search
    ? events.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()))
    : events

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Event History</h1>
          <p className="text-text-secondary text-sm mt-1">{total} total records</p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
            aria-label="Search events"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-text-secondary" />
          <select
            value={kindFilter}
            onChange={e => { setKindFilter(e.target.value); setPage(0) }}
            className="input-field text-sm w-auto"
            aria-label="Filter by kind"
          >
            <option value="">All types</option>
            <option value="Bird">Bird</option>
            <option value="Threat">Threat</option>
          </select>
        </div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[rgba(190,160,255,0.15)] cursor-pointer hover:border-[rgba(190,160,255,0.3)] transition-colors text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={onlyAlerts}
            onChange={e => { setOnlyAlerts(e.target.checked); setPage(0) }}
            className="accent-violet-500"
          />
          Alerts only
        </label>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="px-4 py-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <AlertTriangle size={28} className="text-threat" />
            <p className="text-text-secondary text-sm">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-text-secondary text-sm">No events match your filters.</p>
          </div>
        ) : (
          filtered.map(ev => (
            <EventRow key={ev.id} event={ev} onClick={() => openDetail(ev.id)} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="btn-ghost p-2 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="btn-ghost p-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {(selected || detailLoading) && (
        <EventDetailDrawer
          event={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function EventDetailDrawer({ event, loading, onClose }: {
  event: EventDetail | null
  loading: boolean
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-elevated border-l border-[rgba(190,160,255,0.15)] z-50 overflow-y-auto animate-slide-in shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(190,160,255,0.1)]">
          <h2 className="font-semibold text-text-main">Event Detail</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-main"><X size={18} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-violet-bright border-t-transparent rounded-full animate-spin" />
          </div>
        ) : event ? (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <KindBadge kind={event.kind} />
              <AlertBadge isAlert={event.is_alert} />
              <span className="text-xs text-text-secondary font-mono ml-auto">#{event.id}</span>
            </div>

            <div>
              <p className="label">Detection</p>
              <p className="text-lg font-semibold capitalize">{event.name?.replace(/_/g, ' ')}</p>
              {event.call_type && <p className="text-sm text-text-secondary">Call type: {event.call_type}</p>}
            </div>

            <div>
              <p className="label">Confidence</p>
              <ConfidenceBar value={event.confidence} />
            </div>

            <div>
              <p className="label">Recorded</p>
              <p className="text-sm text-text-main">
                {new Date(event.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
              </p>
            </div>

            <div>
              <p className="label">Location</p>
              {event.location.lat ? (
                <div>
                  <p className="text-sm font-mono text-text-main">
                    {event.location.lat.toFixed(5)}, {event.location.lon?.toFixed(5)}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Source: {event.location.source}</p>
                  {event.location.maps_link && (
                    <a href={event.location.maps_link} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-violet-lavender hover:text-violet-bright">
                      View on Google Maps <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Location unavailable</p>
              )}
            </div>

            <div>
              <p className="label">Clip ID</p>
              <p className="text-xs font-mono text-text-secondary break-all">{event.clip_id}</p>
            </div>

            {event.alert_status && (
              <div>
                <p className="label">Alert Status</p>
                <p className="text-sm capitalize text-text-main">{event.alert_status}</p>
                {event.alert_error && <p className="text-xs text-text-secondary">{event.alert_error}</p>}
              </div>
            )}
          </div>
        ) : null}
      </aside>
    </>
  )
}
