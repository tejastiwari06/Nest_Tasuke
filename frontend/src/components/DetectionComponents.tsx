import { Bird, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import type { DetectionResult, EventRecord } from '../types'

interface ConfidenceBarProps {
  value: number // 0 to 1
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? '#43D9A3' : pct >= 60 ? '#F5B942' : '#FF4D5E'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-text-secondary w-9 text-right">{pct}%</span>
    </div>
  )
}

export function KindBadge({ kind }: { kind: 'Bird' | 'Threat' }) {
  if (kind === 'Threat') {
    return (
      <span className="badge-threat">
        <Zap size={11} />
        Threat
      </span>
    )
  }
  return (
    <span className="badge-bird">
      <Bird size={11} />
      Bird
    </span>
  )
}

export function AlertBadge({ isAlert }: { isAlert: boolean }) {
  if (isAlert) {
    return (
      <span className="badge-threat">
        <AlertTriangle size={11} />
        Alert
      </span>
    )
  }
  return (
    <span className="badge-bird">
      <CheckCircle size={11} />
      Normal
    </span>
  )
}

export function DetectionCard({ det }: { det: DetectionResult }) {
  const isThreat = det.kind === 'Threat'
  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 ${
      isThreat
        ? 'bg-[rgba(255,77,94,0.05)] border-[rgba(255,77,94,0.2)]'
        : 'bg-[rgba(67,217,163,0.04)] border-[rgba(67,217,163,0.15)]'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <KindBadge kind={det.kind} />
          {det.is_alert && (
            <span className="badge-threat text-xs">
              <AlertTriangle size={10} />
              ALERT
            </span>
          )}
        </div>
        <span className="text-xs text-text-secondary font-mono">ID #{det.event_id}</span>
      </div>

      <div className="mb-3">
        <p className="font-semibold text-text-main capitalize">
          {det.name?.replace(/_/g, ' ')}
        </p>
        {det.call_type && (
          <p className="text-xs text-text-secondary mt-0.5">
            Call type: <span className={det.call_type === 'Distress' ? 'text-warning' : 'text-success'}>{det.call_type}</span>
          </p>
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs text-text-secondary mb-1">Confidence</p>
        <ConfidenceBar value={det.confidence} />
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>Email: <span className="text-text-main">{det.email_status.replace('_', ' ')}</span></span>
      </div>
    </div>
  )
}

export function EventRow({ event, onClick }: { event: EventRecord; onClick?: () => void }) {
  const isThreat = event.kind === 'Threat'
  const conf = Math.round(event.confidence * 100)
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3.5 px-4 hover:bg-white/[0.03] transition-colors text-left border-b border-[rgba(190,160,255,0.06)] last:border-0"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isThreat ? 'bg-[rgba(255,77,94,0.15)]' : 'bg-[rgba(67,217,163,0.12)]'
      }`}>
        {isThreat
          ? <Zap size={14} className="text-threat" />
          : <Bird size={14} className="text-success" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main truncate capitalize">
          {event.name?.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-text-secondary">
          {new Date(event.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {event.is_alert && <AlertTriangle size={14} className="text-threat" />}
        <span className={`text-xs font-mono ${conf >= 80 ? 'text-success' : conf >= 60 ? 'text-warning' : 'text-threat'}`}>
          {conf}%
        </span>
        <KindBadge kind={event.kind} />
      </div>
    </button>
  )
}
