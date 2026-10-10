import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { OfficerProfile } from '../types'
import { getMe, logout as apiLogout } from '../services/api'

interface AuthContextValue {
  officer: OfficerProfile | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  officer: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [officer, setOfficer] = useState<OfficerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getMe()
    setOfficer(data)
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setOfficer(null)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ officer, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
