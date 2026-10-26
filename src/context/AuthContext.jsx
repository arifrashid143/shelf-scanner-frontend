import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

// Helper to safely parse JWT token payload claims (role, tenant_id, sub)
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
        // Calls GET /api/auth/me with Bearer token
        const data = await api.getMe()
        let currentUser = data?.user || data?.data?.user || data?.data || data
        
        // Merge with JWT payload claims (embedded role & tenant identity)
        const jwtClaims = parseJwt(token)
        if (jwtClaims && currentUser) {
          currentUser = {
            ...jwtClaims,
            ...currentUser,
            role: currentUser.role || jwtClaims.role || 'user',
            tenant: currentUser.tenant || jwtClaims.tenant || jwtClaims.tenant_id,
            tenant_id: currentUser.tenant_id || jwtClaims.tenant_id,
          }
        }
        setUser(currentUser)
      } catch (err) {
        console.warn('Session verification via GET /api/auth/me failed:', err.message)
        // Check if token is still valid locally
        const jwtClaims = parseJwt(token)
        if (jwtClaims && jwtClaims.exp && jwtClaims.exp * 1000 > Date.now()) {
          setUser(jwtClaims)
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

  // POST /api/auth/login - Authenticates Superadmin, Tenant Admins, and Store Staff
  const login = async (email, password) => {
    setError(null)
    try {
      const data = await api.login(email, password)
      
      // Extract Bearer token from response (supports token, access_token, accessToken, jwt)
      const token = data.token || data.access_token || data.accessToken || data.jwt
      if (!token) {
        throw new Error('No authentication token received in response.')
      }

      localStorage.setItem('shelf_scanner_token', token)

      // Retrieve user profile from login body, /api/auth/me, or embedded JWT claims
      let currentUser = data.user || data.data?.user || data.profile
      const jwtClaims = parseJwt(token)

      if (!currentUser) {
        try {
          const meData = await api.getMe()
          currentUser = meData.user || meData.data?.user || meData.data || meData
        } catch {
          currentUser = jwtClaims
        }
      }

      // Merge JWT claims ensuring role and tenant are preserved
      if (jwtClaims && currentUser) {
        currentUser = {
          ...jwtClaims,
          ...currentUser,
          role: currentUser.role || jwtClaims.role || 'user',
          tenant: currentUser.tenant || jwtClaims.tenant || jwtClaims.tenant_id,
          tenant_id: currentUser.tenant_id || jwtClaims.tenant_id,
        }
      } else if (!currentUser && jwtClaims) {
        currentUser = jwtClaims
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
      const token = data.token || data.access_token || data.accessToken
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

  // Normalized Role Authorization:
  // Admin includes: Superadmin, Tenant Admins, and Store Admins
  const roleStr = (user?.role || user?.user_role || '').toLowerCase()
  const isAdmin =
    roleStr === 'admin' ||
    roleStr === 'superadmin' ||
    roleStr === 'super_admin' ||
    roleStr === 'tenant_admin' ||
    roleStr === 'tenantadmin' ||
    roleStr.includes('admin')

  // User includes: Store Staff and standard Users
  const isUser = !isAdmin && !!user

  const value = {
    user,
    role: user?.role || null,
    tenant: user?.tenant || user?.tenant_id || null,
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
