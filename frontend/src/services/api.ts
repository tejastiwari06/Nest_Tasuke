import axios, { AxiosError } from 'axios'
import type {
  OfficerProfile,
  RegisterRequest,
  AnalyzeResponse,
  EventsResponse,
  EventDetail,
  Stats,
  HealthStatus,
} from '../types'

const BASE = ''  // Vite proxy handles /api → localhost:8000

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,  // send HttpOnly session cookie
  headers: { 'Content-Type': 'application/json' },
})

// Normalize API errors
function normalizeError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data?.detail?.error?.message) return data.detail.error.message
    if (data?.error?.message) return data.error.message
    if (data?.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    if (err.message) return err.message
  }
  return 'An unexpected error occurred'
}

// Auth
export async function register(payload: RegisterRequest) {
  try {
    const res = await api.post('/api/auth/register', payload)
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

export async function verifyEmail(email: string, code: string) {
  try {
    const res = await api.post('/api/auth/verify-email', { email, code })
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

export async function login(email: string) {
  try {
    const res = await api.post('/api/auth/login', { email })
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

export async function loginVerify(email: string, code: string) {
  try {
    const res = await api.post('/api/auth/login/verify', { email, code })
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

export async function logout() {
  try {
    await api.post('/api/auth/logout')
    return { error: null }
  } catch (e) {
    return { error: normalizeError(e) }
  }
}

export async function getMe(): Promise<OfficerProfile | null> {
  try {
    const res = await api.get<OfficerProfile>('/api/me')
    return res.data
  } catch {
    return null
  }
}

// Analyze
export async function analyzeAudio(formData: FormData) {
  try {
    const res = await api.post<AnalyzeResponse>('/api/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

// Events
export async function getEvents(params: {
  limit?: number
  offset?: number
  kind?: string
  only_alerts?: boolean
}) {
  try {
    const res = await api.get<EventsResponse>('/api/events', { params })
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

export async function getEvent(id: number) {
  try {
    const res = await api.get<EventDetail>(`/api/events/${id}`)
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

// Stats
export async function getStats() {
  try {
    const res = await api.get<Stats>('/api/stats')
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

// Health
export async function getHealth() {
  try {
    const res = await api.get<HealthStatus>('/api/health')
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}

// Test alert
export async function sendTestAlert(lat?: number, lon?: number) {
  try {
    const fd = new FormData()
    if (lat !== undefined) fd.append('lat', lat.toString())
    if (lon !== undefined) fd.append('lon', lon.toString())
    fd.append('zone_id', 'Zone_1')
    const res = await api.post('/api/test-alert', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return { data: res.data, error: null }
  } catch (e) {
    return { data: null, error: normalizeError(e) }
  }
}
