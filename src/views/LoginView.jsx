import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

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

  // Real-time validation for email and password
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

  // Real-time onChange handler for authentication fields
  const handleEmailChange = (e) => {
    const val = e.target.value
    setEmail(val)
    if (errorMsg) setErrorMsg('')

    // Validate on change if field was already touched or has content
    if (touched.email || val.length > 0) {
      const err = validateField('email', val)
      setErrors((prev) => ({ ...prev, email: err }))
    }
  }

  const handlePasswordChange = (e) => {
    const val = e.target.value
    setPassword(val)
    if (errorMsg) setErrorMsg('')

    // Validate on change if field was already touched or has content
    if (touched.password || val.length > 0) {
      const err = validateField('password', val)
      setErrors((prev) => ({ ...prev, password: err }))
    }
  }

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
    const val = fieldName === 'email' ? email : password
    const err = validateField(fieldName, val)
    setErrors((prev) => ({ ...prev, [fieldName]: err }))
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setErrorMsg('')

    const emailErr = validateField('email', email)
    const pwdErr = validateField('password', password)
    const newErrors = {}
    if (emailErr) newErrors.email = emailErr
    if (pwdErr) newErrors.password = pwdErr

    setTouched({ email: true, password: true })
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
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
    <div className="min-h-screen w-full bg-[#FAF9FF] relative overflow-hidden flex items-center justify-center p-4 sm:p-8 lg:p-12 font-sans select-none">
      {/* Soft top-left purple radial gradient matching photo */}
      <div className="absolute -top-28 -left-28 w-[620px] h-[620px] bg-gradient-to-br from-[#776BBF]/45 via-[#9E93E8]/30 to-transparent rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[440px] h-[440px] bg-gradient-to-tr from-[#9B90E8]/20 via-[#B5ABF5]/10 to-transparent rounded-full blur-[85px] pointer-events-none" />

      {/* Main Grid Wrapper */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* ===================== LEFT COLUMN (HEADLINE & VALUE PROPS) ===================== */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pl-2 sm:pl-4">
          {/* Main Hero Headline */}
          <div>
            <h1 className="text-4xl lg:text-[46px] font-black text-[#15124D] tracking-tight leading-[1.12]">
              Scan Fast.<br />
              Never Run Out.
            </h1>
          </div>

          {/* Feature List */}
          <div className="space-y-6 max-w-md">
            {/* Feature 1: Instant Shelf Audits */}
            <div className="flex items-start gap-4">
              <div className="mt-1 shrink-0 text-[#15124D]">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 7h4v18H5" />
                  <path d="M16 7v18" strokeWidth="3.8" />
                  <path d="M27 7h-4v18h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#15124D] tracking-tight">
                  Instant Shelf Audits
                </h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-1">
                  Take one photo of a shelf and ShelfScan reads every product, counts stock and updates your inventory in seconds.
                </p>
              </div>
            </div>

            {/* Feature 2: Smart Reorder Alerts */}
            <div className="flex items-start gap-4">
              <div className="mt-1 shrink-0 text-[#15124D]">
                <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="8" width="24" height="13" rx="3" fill="currentColor" />
                  <rect x="9" y="13" width="14" height="2.5" rx="1.2" fill="white" />
                  <path d="M4 25h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#15124D] tracking-tight">
                  Smart Reorder Alerts
                </h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-1">
                  The reorder agent compares new photos with your last scan, flags low stock early and suggests what to order next.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT COLUMN (LOGIN FORM CARD) ===================== */}
        <div className="w-full lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-[380px] sm:max-w-[400px] bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(79,70,229,0.08)] border border-slate-100/80 flex flex-col items-center">
            {/* Centered App Logo */}
            <div className="mb-4 flex items-center justify-center">
              <img
                src={logoImg}
                alt="ShelfScan"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-contain shadow-md shadow-indigo-500/20"
              />
            </div>

            {/* Header: "Welcome back" */}
            <h2 className="text-2xl font-bold text-[#15124D] tracking-tight text-center">
              Welcome back
            </h2>
            <p className="text-xs text-slate-400 mt-1 text-center mb-6">
              Don&apos;t have an account?{' '}
              <span className="text-[#4F46E5] font-semibold hover:underline cursor-pointer">
                Sign up
              </span>
            </p>

            {/* Server Error Message */}
            {errorMsg && (
              <div className="w-full mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg('')}
                  className="text-rose-500 hover:text-rose-800 text-sm ml-2 font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3.5" noValidate>
              {/* Email Address with real-time onChange authentication validation */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="Email address"
                  autoComplete="email"
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none transition-all ${
                    touched.email && errors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 bg-rose-50/10'
                      : 'border-slate-200/90 focus:border-[#4745B2] focus:ring-2 focus:ring-[#4745B2]/15'
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password with Eye Toggle and real-time onChange authentication validation */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Password"
                    autoComplete="current-password"
                    className={`w-full px-4 py-2.5 pr-10 bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none transition-all ${
                      touched.password && errors.password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 bg-rose-50/10'
                        : 'border-slate-200/90 focus:border-[#4745B2] focus:ring-2 focus:ring-[#4745B2]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Terms agreement note: "By logging in you agree to our Terms of Use and Privacy Policy." */}
              <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
                By logging in you agree to our{' '}
                <span className="text-[#15124D] font-bold cursor-pointer hover:underline">
                  Terms of Use
                </span>{' '}
                and{' '}
                <span className="text-[#15124D] font-bold cursor-pointer hover:underline">
                  Privacy Policy
                </span>
                .
              </p>

              {/* Action Button: Login in exact purple-indigo #4745B2 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 bg-[#4745B2] hover:bg-[#3d3b9e] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#4745B2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in…</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
