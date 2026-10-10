import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Mic, MapPin, AlertTriangle, CheckCircle, Loader2, X, ExternalLink } from 'lucide-react'
import { analyzeAudio } from '../../services/api'
import type { AnalyzeResponse } from '../../types'
import { DetectionCard, ConfidenceBar } from '../../components/DetectionComponents'
import { Waveform } from '../../components/ui/Skeleton'
import { toast } from '../../components/ui/Toast'

type Stage = 'idle' | 'selected' | 'processing' | 'done' | 'error'

const ZONES = ['Zone_1', 'Zone_2', 'Zone_3', 'Zone_4', 'Zone_5']

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [zoneId, setZoneId] = useState('Zone_1')
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [locSource, setLocSource] = useState<'pending' | 'browser' | 'manual' | 'none'>('pending')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Try geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude)
          setLon(pos.coords.longitude)
          setAccuracy(pos.coords.accuracy)
          setLocSource('browser')
        },
        () => setLocSource('none')
      )
    } else {
      setLocSource('none')
    }
  }, [])

  const handleFile = (f: File) => {
    if (!f.type.startsWith('audio/') && f.type !== 'video/webm') {
      toast.error('File must be an audio file (WAV, MP3, OGG, WebM…)')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum is 10 MB.')
      return
    }
    setFile(f)
    setStage('selected')
    setResult(null)
    setErrorMsg('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const getLocation = () => {
    if (locSource === 'manual') {
      const la = parseFloat(manualLat)
      const lo = parseFloat(manualLon)
      if (isNaN(la) || isNaN(lo)) return null
      return { lat: la, lon: lo, accuracy: null }
    }
    if (lat !== null && lon !== null) return { lat, lon, accuracy }
    return null
  }

  const handleSubmit = async () => {
    if (!file) return
    setStage('processing')
    const fd = new FormData()
    fd.append('audio', file)
    fd.append('zone_id', zoneId)
    const loc = getLocation()
    if (loc) {
      fd.append('lat', loc.lat.toString())
      fd.append('lon', loc.lon.toString())
      if (loc.accuracy) fd.append('accuracy', loc.accuracy.toString())
    }

    const { data, error } = await analyzeAudio(fd)
    if (data) {
      setResult(data)
      setStage('done')
      if (data.ALERT) toast.error('THREAT DETECTED — Check results below')
      else toast.success('Analysis complete')
    } else {
      setErrorMsg(error ?? 'Analysis failed')
      setStage('error')
      toast.error(error ?? 'Analysis failed')
    }
  }

  const reset = () => {
    setFile(null)
    setStage('idle')
    setResult(null)
    setErrorMsg('')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Analyze Recording</h1>
        <p className="text-text-secondary text-sm mt-1">
          Upload a forest audio recording for acoustic threat and wildlife analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upload + config */}
        <div className="lg:col-span-3 space-y-4">
          {/* Drop zone */}
          {stage === 'idle' || stage === 'selected' ? (
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                isDragging
                  ? 'border-violet-bright bg-violet-primary/10'
                  : file
                  ? 'border-[rgba(67,217,163,0.4)] bg-[rgba(67,217,163,0.04)]'
                  : 'border-[rgba(190,160,255,0.2)] hover:border-[rgba(190,160,255,0.4)] bg-elevated/50'
              }`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/webm"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                aria-label="Upload audio file"
              />
              {file ? (
                <div className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
                    <Mic size={22} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-main truncate">{file.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                    </p>
                    {file && <audio ref={audioRef} src={URL.createObjectURL(file)} controls className="mt-3 w-full h-8 opacity-70" />}
                  </div>
                  <button onClick={e => { e.stopPropagation(); reset() }} className="text-text-secondary hover:text-threat shrink-0">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-primary/20 flex items-center justify-center mb-4">
                    <Upload size={24} className="text-violet-lavender" />
                  </div>
                  <p className="font-medium text-text-main">Drop audio file here</p>
                  <p className="text-sm text-text-secondary mt-1">or click to browse</p>
                  <p className="text-xs text-text-secondary mt-3 opacity-60">WAV · MP3 · OGG · WebM · max 10 MB</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Processing */}
          {stage === 'processing' && (
            <div className="card flex flex-col items-center py-12 gap-5">
              <Waveform size="lg" />
              <div className="text-center">
                <p className="font-semibold text-text-main">Analyzing recording…</p>
                <p className="text-sm text-text-secondary mt-1">This may take 1–3 seconds per second of audio.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Loader2 size={14} className="animate-spin" />
                Running ML inference
              </div>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="card border-[rgba(255,77,94,0.3)] bg-[rgba(255,77,94,0.05)]">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-threat shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-threat">Analysis failed</p>
                  <p className="text-sm text-text-secondary mt-1">{errorMsg}</p>
                </div>
              </div>
              <button onClick={reset} className="btn-secondary mt-4 text-sm">Try again</button>
            </div>
          )}

          {/* Zone & location */}
          {(stage === 'idle' || stage === 'selected') && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-text-main">Recording Details</h3>
              <div>
                <label htmlFor="zone-select" className="label">Zone ID</label>
                <select
                  id="zone-select"
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  className="input-field"
                >
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Location</label>
                  <button
                    type="button"
                    onClick={() => setLocSource(s => s === 'manual' ? (lat ? 'browser' : 'none') : 'manual')}
                    className="text-xs text-violet-lavender hover:text-violet-bright"
                  >
                    {locSource === 'manual' ? 'Use GPS' : 'Enter manually'}
                  </button>
                </div>
                {locSource === 'browser' && lat && (
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                    <MapPin size={14} />
                    {lat.toFixed(5)}, {lon?.toFixed(5)} (±{accuracy?.toFixed(0)}m)
                  </div>
                )}
                {locSource === 'none' && (
                  <p className="text-xs text-text-secondary bg-elevated rounded-lg px-3 py-2">
                    GPS unavailable. Enter coordinates manually or proceed without location.
                  </p>
                )}
                {locSource === 'pending' && (
                  <p className="text-xs text-text-secondary">Requesting GPS…</p>
                )}
                {locSource === 'manual' && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label htmlFor="lat-input" className="label text-xs">Latitude</label>
                      <input id="lat-input" type="number" step="any" value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="28.0000" className="input-field text-sm" />
                    </div>
                    <div>
                      <label htmlFor="lon-input" className="label text-xs">Longitude</label>
                      <input id="lon-input" type="number" step="any" value={manualLon} onChange={e => setManualLon(e.target.value)} placeholder="77.0000" className="input-field text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          {(stage === 'selected') && (
            <button
              id="analyze-btn"
              onClick={handleSubmit}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              <Mic size={18} />
              Analyze Recording
            </button>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {stage === 'done' && result ? (
            <AnalysisResult result={result} />
          ) : (
            <div className="card h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-primary/10 flex items-center justify-center mb-4">
                <Mic size={24} className="text-violet-lavender/40" />
              </div>
              <p className="text-sm text-text-secondary">Analysis results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AnalysisResult({ result }: { result: AnalyzeResponse }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary bar */}
      <div className={`rounded-xl p-4 border flex items-center gap-3 ${
        result.ALERT
          ? 'bg-[rgba(255,77,94,0.08)] border-[rgba(255,77,94,0.3)]'
          : 'bg-[rgba(67,217,163,0.06)] border-[rgba(67,217,163,0.2)]'
      }`}>
        {result.ALERT
          ? <AlertTriangle size={20} className="text-threat shrink-0" />
          : <CheckCircle size={20} className="text-success shrink-0" />
        }
        <div className="flex-1">
          <p className={`font-semibold ${result.ALERT ? 'text-threat' : 'text-success'}`}>
            {result.ALERT ? 'THREAT DETECTED' : result.status === 'detected' ? 'Detection Complete' : 'No Detections'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {new Date(result.processed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Location</p>
          {result.location.maps_link && (
            <a href={result.location.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-lavender hover:text-violet-bright flex items-center gap-1">
              Maps <ExternalLink size={11} />
            </a>
          )}
        </div>
        {result.location.lat ? (
          <p className="text-sm text-text-main font-mono">
            {result.location.lat.toFixed(5)}, {result.location.lon?.toFixed(5)}
          </p>
        ) : (
          <p className="text-sm text-text-secondary">Location unavailable</p>
        )}
        <p className="text-xs text-text-secondary mt-0.5 capitalize">Source: {result.location.source}</p>
      </div>

      {/* Detections */}
      {result.detections.length === 0 ? (
        <div className="card text-center py-8">
          <CheckCircle size={28} className="text-text-secondary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No threats or wildlife detected in this recording.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            {result.detections.length} Detection{result.detections.length > 1 ? 's' : ''}
          </p>
          {result.detections.map(det => <DetectionCard key={det.event_id} det={det} />)}
        </div>
      )}

      <p className="text-xs text-text-secondary font-mono">Clip: {result.clip_id.slice(0, 8)}…</p>
    </div>
  )
}
