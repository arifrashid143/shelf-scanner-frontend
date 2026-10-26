import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

// Helper to safely parse JWT token payload claims (role, sub, exp)
function parseJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.warn('Could not parse JWT token claims:', err)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verify stored token on app boot via GET /api/auth/me
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('shelf_scanner_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await api.getMe()
        const rawUser = data?.user || data?.data?.user || data
        const jwtClaims = parseJwt(token)

        const currentUser = {
          ...rawUser,
          name: rawUser.full_name || rawUser.name || rawUser.email?.split('@')[0] || 'User',
          role: String(rawUser.role || jwtClaims?.role || 'user').toLowerCase(),
          tenant_id: rawUser.tenant_id ?? jwtClaims?.tenant_id ?? null,
        }
        setUser(currentUser)
      } catch (err) {
        console.warn('Session verification via GET /api/auth/me failed:', err.message)
        const jwtClaims = parseJwt(token)
        if (jwtClaims && jwtClaims.exp && jwtClaims.exp * 1000 > Date.now()) {
          setUser({
            ...jwtClaims,
            name: jwtClaims.name || jwtClaims.full_name || jwtClaims.sub || 'User',
            role: String(jwtClaims.role || 'user').toLowerCase(),
          })
        } else {
          localStorage.removeItem('shelf_scanner_token')
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // POST /api/auth/login - Authenticates with https://ai-vs-scanner-be.aiiotgeeks.tech/api/auth/login
  const login = async (email, password) => {
    setError(null)
    try {
      const data = await api.login(email, password)
      
      // Extract Bearer token (API returns access_token)
      const token = data.access_token || data.token || data.accessToken || data.jwt
      if (!token) {
        throw new Error('No authentication token received in response.')
      }

      localStorage.setItem('shelf_scanner_token', token)

      const rawUser = data.user || data.data?.user || data.profile
      const jwtClaims = parseJwt(token)

      let currentUser = null
      if (rawUser) {
        currentUser = {
          ...rawUser,
          name: rawUser.full_name || rawUser.name || rawUser.email?.split('@')[0] || 'User',
          role: String(rawUser.role || jwtClaims?.role || 'user').toLowerCase(),
          tenant_id: rawUser.tenant_id ?? jwtClaims?.tenant_id ?? null,
        }
      } else {
        try {
          const meData = await api.getMe()
          currentUser = {
            ...meData,
            name: meData.full_name || meData.name || meData.email?.split('@')[0] || 'User',
            role: String(meData.role || jwtClaims?.role || 'user').toLowerCase(),
            tenant_id: meData.tenant_id ?? jwtClaims?.tenant_id ?? null,
          }
        } catch {
          currentUser = jwtClaims ? {
            ...jwtClaims,
            name: jwtClaims.name || jwtClaims.full_name || jwtClaims.sub || 'User',
            role: String(jwtClaims.role || 'user').toLowerCase(),
          } : null
        }
      }

      setUser(currentUser)
      return currentUser
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    }
  }

  const signup = async (formData) => {
    setError(null)
    try {
      const data = await api.signup(formData)
      const token = data.access_token || data.token
      if (token) {
        localStorage.setItem('shelf_scanner_token', token)
      }
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Signup failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('shelf_scanner_token')
      setUser(null)
    }
  }

  // Normalized Role Evaluation:
  // Superadmin, Tenant Admin, and Admin are treated as Admin
  const roleStr = String(user?.role || user?.user_role || '').toLowerCase()
  const isAdmin =
    roleStr === 'superadmin' ||
    roleStr === 'super_admin' ||
    roleStr === 'admin' ||
    roleStr === 'tenant_admin' ||
    roleStr === 'store_admin' ||
    roleStr.includes('admin')

  // Staff and standard users
  const isUser = !isAdmin && !!user

  const value = {
    user,
    role: user?.role || null,
    tenant_id: user?.tenant_id || null,
    isAdmin,
    isUser,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
