import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Send, LogOut, AlertTriangle } from 'lucide-react'
import { getHealth, sendTestAlert, logout as apiLogout } from '../../services/api'
import type { HealthStatus } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from '../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { officer, logout } = useAuth()
  const navigate = useNavigate()
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [alertSending, setAlertSending] = useState(false)

  useEffect(() => {
    async function load() {
      setHealthLoading(true)
      const { data } = await getHealth()
      if (data) setHealth(data)
      setHealthLoading(false)
    }
    load()
  }, [])

  const handleTestAlert = async () => {
    setAlertSending(true)
    const { error } = await sendTestAlert()
    if (error) {
      toast.error('Test alert failed: ' + error)
    } else {
      toast.success('Test alert queued. Check your inbox.')
    }
    setAlertSending(false)
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">System health and officer profile</p>
      </div>

      {/* Officer Profile */}
      {officer && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-text-main">Officer Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" value={officer.full_name} />
            <Field label="Email" value={officer.email} />
            <Field label="Designation" value={officer.designation} />
            <Field label="Phone" value={officer.phone ?? '—'} />
            <Field label="Forest Division" value={officer.forest_division} />
            <Field label="Forest Range" value={officer.forest_range} />
          </div>
          <div className="pt-2 border-t border-[rgba(190,160,255,0.08)]">
            <p className="text-xs text-text-secondary">
              Joined: {new Date(officer.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-main">System Health</h2>
          <button
            onClick={() => { setHealthLoading(true); getHealth().then(r => { if (r.data) setHealth(r.data); setHealthLoading(false) }) }}
            className="text-xs text-violet-lavender hover:text-violet-bright"
          >
            Refresh
          </button>
        </div>
        {healthLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : health ? (
          <div className="space-y-2">
            <HealthItem
              label="ML Inference Model"
              ok={health.model_loaded}
              detail={health.model_error ? `Error: ${health.model_error}` : 'Loaded and ready'}
            />
            <HealthItem
              label="FFmpeg Audio Converter"
              ok={health.ffmpeg_ok}
              detail={health.ffmpeg_ok ? 'Found in PATH' : 'Not found — audio upload will fail'}
            />
            <HealthItem
              label="SMTP Email"
              ok={health.smtp_configured}
              detail={health.smtp_configured ? 'Configured' : 'Not configured — alert emails will not be sent'}
            />
            <HealthItem
              label="Production Mode"
              ok={!health.dev_mode}
              detail={health.dev_mode ? 'Dev mode active (OTPs printed to console)' : 'Production mode active'}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-threat text-sm">
            <AlertTriangle size={16} />
            Could not reach backend
          </div>
        )}
      </div>

      {/* Test Alert */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-text-main">Send Test Alert</h2>
        <p className="text-sm text-text-secondary">
          Sends a test threat email to your registered email address. Useful for verifying SMTP configuration.
        </p>
        {!health?.smtp_configured && (
          <div className="flex items-start gap-2 text-warning text-xs bg-[rgba(245,185,66,0.08)] border border-[rgba(245,185,66,0.2)] rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            SMTP is not configured. The alert will be recorded in the database but no email will be delivered.
          </div>
        )}
        <button
          onClick={handleTestAlert}
          disabled={alertSending}
          className="btn-primary"
        >
          {alertSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={15} />
          )}
          {alertSending ? 'Sending…' : 'Send Test Alert'}
        </button>
      </div>

      {/* Logout */}
      <div className="card border-[rgba(255,77,94,0.15)]">
        <h2 className="font-semibold text-text-main mb-2">Sign Out</h2>
        <p className="text-sm text-text-secondary mb-4">
          Your session cookie will be cleared. You will need to verify your email again to log in.
        </p>
        <button onClick={handleLogout} className="btn-secondary border-threat/30 text-threat hover:text-threat hover:border-threat/60">
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-secondary mb-0.5">{label}</p>
      <p className="text-sm font-medium text-text-main">{value}</p>
    </div>
  )
}

function HealthItem({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3 border border-[rgba(190,160,255,0.06)]">
      <div>
        <p className="text-sm font-medium text-text-main">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{detail}</p>
      </div>
      {ok
        ? <CheckCircle size={18} className="text-success shrink-0" />
        : <XCircle size={18} className="text-threat shrink-0" />
      }
    </div>
  )
}
