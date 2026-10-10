// Typed API response shapes matching the backend schemas exactly

export interface OfficerProfile {
  id: number
  email: string
  full_name: string
  designation: string
  forest_division: string
  forest_range: string
  phone?: string
  is_verified: boolean
  created_at: string
}

export interface RegisterRequest {
  email: string
  full_name: string
  designation: string
  forest_division: string
  forest_range: string
  phone?: string
}

export interface LocationResult {
  lat: number | null
  lon: number | null
  accuracy_m: number | null
  source: string
  maps_link: string | null
}

export interface DetectionResult {
  event_id: number
  kind: 'Bird' | 'Threat'
  name: string
  call_type: string | null
  confidence: number
  is_alert: boolean
  email_status: 'sent' | 'queued' | 'skipped' | 'not_applicable'
}

export interface AnalyzeResponse {
  clip_id: string
  ALERT: boolean
  status: 'detected' | 'no_detection'
  location: LocationResult
  detections: DetectionResult[]
  processed_at: string
}

export interface EventRecord {
  id: number
  clip_id: string
  kind: 'Bird' | 'Threat'
  name: string
  call_type: string | null
  confidence: number
  is_alert: boolean
  created_at: string
  location: LocationResult
  alert_status: string | null
}

export interface EventDetail extends EventRecord {
  raw_json: string
  alert_error: string | null
}

export interface EventsResponse {
  total: number
  events: EventRecord[]
}

export interface Stats {
  total_events: number
  alerts_today: number
  by_kind: Record<string, number>
  by_name: Record<string, number>
  last_event_at: string | null
  report: Record<string, unknown>
}

export interface HealthStatus {
  model_loaded: boolean
  model_error: string | null
  ffmpeg_ok: boolean
  smtp_configured: boolean
  dev_mode: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
