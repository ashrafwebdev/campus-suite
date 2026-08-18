import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api, apiErrorMessage, clearToken, getToken, setToken } from '../lib/api'
import type { CurrentUser } from '../types/api'

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (slug: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const response = await api.get<CurrentUser>('/auth/me')
      setUser(response.data)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (getToken()) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    try {
      const response = await api.post<{ access_token: string }>('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      setToken(response.data.access_token)
      await fetchMe()
    } catch (error) {
      throw new Error(apiErrorMessage(error))
    }
  }, [fetchMe])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (slug: string) => {
      if (!user?.role) return false
      if (user.role.name === 'admin') return true
      return user.role.permissions.some((p) => p.slug === slug)
    },
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
