import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: {
    name: string
    email: string
    phone?: string
    password: string
    password_confirmation: string
    role?: string
  }) => Promise<User>
  /** Connexion après création auto du compte à la réservation. */
  appliquerSession: (token: string, user?: User | null) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('locagabon_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      localStorage.removeItem('locagabon_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('locagabon_token', data.token)
    setUser(data.user)
    return data.user as User
  }, [])

  const register = useCallback(async (payload: {
    name: string
    email: string
    phone?: string
    password: string
    password_confirmation: string
    role?: string
  }) => {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('locagabon_token', data.token)
    setUser(data.user)
    return data.user as User
  }, [])

  const appliquerSession = useCallback(async (token: string, utilisateur?: User | null) => {
    localStorage.setItem('locagabon_token', token)
    if (utilisateur) {
      setUser(utilisateur)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {
      localStorage.removeItem('locagabon_token')
      setUser(null)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('locagabon_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, appliquerSession, logout, refresh }),
    [user, loading, login, register, appliquerSession, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
