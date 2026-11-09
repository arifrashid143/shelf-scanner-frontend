import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'
import { Loader2, Eye, EyeOff, AlertCircle, Lock, Mail } from 'lucide-react'

export default function LoginView() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (fieldName, value) => {
    let error = ''
    if (fieldName === 'email') {
      const val = (value ?? '').trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
      if (!val) {
        error = 'Email address is required'
      } else if (!emailRegex.test(val)) {
        error = 'Please enter a valid email address'
      }
    } else if (fieldName === 'password') {
      if (!value) {
        error = 'Password is required'
      }
    }
    return error
  }

  const validateAll = () => {
    const newErrors = {}
    const emailErr = validateField('email', email)
    if (emailErr) newErrors.email = emailErr

    const pwdErr = validateField('password', password)
    if (pwdErr) newErrors.password = pwdErr

    return newErrors
  }

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
    const val = fieldName === 'email' ? email : password
    const err = validateField(fieldName, val)
    setErrors((prev) => ({ ...prev, [fieldName]: err }))
  }

  const handleChange = (fieldName, value) => {
    if (fieldName === 'email') setEmail(value)
    if (fieldName === 'password') setPassword(value)

    if (errors[fieldName] || touched[fieldName]) {
      const err = validateField(fieldName, value)
      setErrors((prev) => ({ ...prev, [fieldName]: err }))
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setErrorMsg('')

    const validationErrors = validateAll()
    setTouched({ email: true, password: true })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      await login(email.trim(), password)
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex flex-col font-sans text-slate-900 select-none">
      {/* Top Header Bar Matching Dashboard Brand */}
      <header className="h-14 bg-[#1E1E68] text-white flex items-center justify-between px-4 sm:px-6 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="Shelf Scanner Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain bg-white/10 p-0.5"
          />
          <span className="text-base sm:text-lg font-bold tracking-tight">
            Shelf Scanner
          </span>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[420px] bg-white rounded-md border border-slate-200/90 shadow-2xs p-6 sm:p-8">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[#5956c6]/10 text-[#5956c6] mb-3">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sign in to access your store inventory & scanner
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-rose-500 hover:text-rose-800 text-sm ml-2 font-bold cursor-pointer"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-md text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none transition-all ${
                    touched.email && errors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/10'
                      : 'border-slate-200 focus:border-[#5956c6] focus:ring-2 focus:ring-[#5956c6]/20'
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-white border rounded-md text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none transition-all ${
                    touched.password && errors.password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/10'
                      : 'border-slate-200 focus:border-[#5956c6] focus:ring-2 focus:ring-[#5956c6]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Terms note */}
            <p className="text-[11px] text-slate-400 text-center leading-normal pt-1">
              Protected by Visual Shelf Scanner enterprise authentication.
            </p>

            {/* Action Button: Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
