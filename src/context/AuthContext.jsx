import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verify stored token on app boot
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('shelf_scanner_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await api.getMe()
        setUser(data.user)
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message)
        localStorage.removeItem('shelf_scanner_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const data = await api.login(email, password)
      localStorage.setItem('shelf_scanner_token', data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Login failed')
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

  const value = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isAuthenticated: !!user,
    loading,
    error,
    login,
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
