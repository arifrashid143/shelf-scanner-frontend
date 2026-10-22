import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginView() {
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@shelfscanner.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setEmail(quickEmail)
    setPassword(quickPassword)
    setErrorMsg('')
    setLoading(true)

    try {
      await login(quickEmail, quickPassword)
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-9 border border-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <img
            src={logoImg}
            alt="Shelf Scanner"
            className="w-16 h-16 rounded-2xl mx-auto shadow-md mb-3 object-contain"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shelf Scanner</h1>
          <p className="text-xs text-slate-500 mt-1">
            AI-based Shelf Reading & Inventory Reordering
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@store.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-blue-600 focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-blue-600 focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Role-Based Testing Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Role Login
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@shelfscanner.com', 'admin123')}
              disabled={loading}
              className="p-3 rounded-2xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-left transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4" />
                Admin
              </div>
              <p className="text-[10px] text-purple-900/70">
                Full access: approve POs & edit stock
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('user@shelfscanner.com', 'user123')}
              disabled={loading}
              className="p-3 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-left transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs mb-1">
                <UserCheck className="w-4 h-4" />
                User (Staff)
              </div>
              <p className="text-[10px] text-blue-900/70">
                Scan shelves, view stock & generate POs
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

