import { useEffect, useState, useRef } from 'react'
import { MapPin, AlertTriangle, Bird, Zap } from 'lucide-react'
import { getEvents } from '../../services/api'
import type { EventRecord } from '../../types'

export default function MapPage() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EventRecord | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await getEvents({ limit: 100 })
      if (data) setEvents(data.events)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return
    const withCoords = events.filter(e => e.location.lat !== null)
    if (withCoords.length === 0) return

    import('leaflet').then(L => {
      const map = L.map(mapContainerRef.current!, {
        center: [withCoords[0].location.lat!, withCoords[0].location.lon!],
        zoom: 10,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(map)

      withCoords.forEach(ev => {
        const isThreat = ev.kind === 'Threat'
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${isThreat ? 'rgba(255,77,94,0.9)' : 'rgba(67,217,163,0.9)'};border:2px solid ${isThreat ? '#ff4d5e' : '#43d9a3'};font-size:13px;">${isThreat ? '⚡' : '🐦'}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        const marker = L.marker([ev.location.lat!, ev.location.lon!], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="min-width:180px">
            <p style="font-weight:600;margin-bottom:4px;color:#F7F4FC;text-transform:capitalize">
              ${ev.kind === 'Threat' ? '⚡' : '🐦'} ${ev.name?.replace(/_/g, ' ')}
            </p>
            <p style="font-size:12px;color:#A49AAF">
              ${new Date(ev.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p style="font-size:12px;color:#A49AAF;margin-top:2px">Confidence: ${Math.round(ev.confidence * 100)}%</p>
            ${ev.location.maps_link ? `<a href="${ev.location.maps_link}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#B69AFF;margin-top:6px;display:inline-flex;">Google Maps ↗</a>` : ''}
          </div>
        `)
        marker.on('click', () => setSelected(ev))
      })

      mapRef.current = map
    }).catch(console.error)
  }, [loading, events])

  const withCoords = events.filter(e => e.location.lat !== null)
  const withoutCoords = events.filter(e => e.location.lat === null)

  return (
    <div className="max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Forest Map</h1>
        <p className="text-text-secondary text-sm mt-1">
          {withCoords.length} located event{withCoords.length !== 1 ? 's' : ''}
          {withoutCoords.length > 0 && ` · ${withoutCoords.length} without location`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 560 }}>
        {/* Map panel */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-[rgba(190,160,255,0.12)] relative bg-elevated">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-text-secondary">
                <div className="w-4 h-4 border-2 border-violet-bright border-t-transparent rounded-full animate-spin" />
                Loading events…
              </div>
            </div>
          ) : withCoords.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <MapPin size={32} className="text-text-secondary opacity-40" />
              <p className="text-text-secondary text-sm">No events with location data yet.</p>
              <p className="text-xs text-text-secondary/60 max-w-xs text-center">Provide GPS coordinates when analyzing audio to see events plotted here.</p>
            </div>
          ) : (
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        {/* Event list */}
        <div className="card p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[rgba(190,160,255,0.08)] shrink-0">
            <p className="text-sm font-semibold text-text-main">Events</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-text-secondary text-sm">Loading…</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-text-secondary text-sm">No events recorded yet.</div>
            ) : (
              events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => ev.location.lat !== null && setSelected(ev)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] border-b border-[rgba(190,160,255,0.06)] last:border-0 transition-colors ${selected?.id === ev.id ? 'bg-violet-primary/10' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ev.kind === 'Threat' ? 'bg-[rgba(255,77,94,0.15)]' : 'bg-[rgba(67,217,163,0.12)]'}`}>
                    {ev.kind === 'Threat'
                      ? <Zap size={13} className="text-threat" />
                      : <Bird size={13} className="text-success" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-main truncate capitalize">{ev.name?.replace(/_/g, ' ')}</p>
                    {ev.location.lat !== null
                      ? <p className="text-[10px] text-success font-mono">{ev.location.lat.toFixed(3)}, {ev.location.lon?.toFixed(3)}</p>
                      : <p className="text-[10px] text-text-secondary">No location</p>
                    }
                  </div>
                  {ev.is_alert && <AlertTriangle size={12} className="text-threat shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {withoutCoords.length > 0 && (
        <div className="card border-[rgba(190,160,255,0.08)] flex items-center gap-3">
          <MapPin size={16} className="text-text-secondary shrink-0" />
          <p className="text-sm text-text-secondary">
            {withoutCoords.length} event{withoutCoords.length > 1 ? 's' : ''} cannot be mapped — no location was recorded at analysis time.
          </p>
        </div>
      )}
    </div>
  )
}
