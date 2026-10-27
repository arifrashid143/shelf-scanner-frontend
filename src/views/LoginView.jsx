import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.png'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginView() {
  const { login, signup } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signup({ name, email, password, role })
      } else {
        await login(email, password)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Full-Screen Container: Takes all screen on mobile (pure white), Card layout on tablet/desktop */
    <div className="min-h-screen w-screen bg-white sm:bg-[#F6F6F6] relative overflow-x-hidden flex items-center justify-center p-0 sm:p-8 lg:p-14 font-sans select-none">
      
      {/* Ambient Radial Blur Glows (Tablet & Desktop only) */}
      <div className="hidden sm:block absolute top-12 left-1/4 -translate-x-1/4 w-[480px] h-[480px] bg-gradient-to-br from-[#8b5cf6]/25 via-[#7c3aed]/15 to-[#6366f1]/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="hidden sm:block absolute bottom-16 left-12 w-[420px] h-[420px] bg-[#34d399]/20 rounded-full blur-[85px] pointer-events-none" />

      {/* Top-Left Brand Logo for Tablet Viewports (hidden on mobile and xl desktop) */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 hidden sm:flex xl:hidden items-center gap-3">
        <img
          src={logoImg}
          alt="ShelfScan"
          className="w-10 h-10 rounded-xl object-contain shadow-xs shrink-0"
        />
        <span className="text-2xl font-black text-[#1E1E68] tracking-tight">
          ShelfScan
        </span>
      </div>

      {/* Main Grid Wrapper */}
      <div className="relative z-10 w-full min-h-screen sm:min-h-0 sm:max-w-6xl grid grid-cols-1 xl:grid-cols-12 gap-0 sm:gap-10 xl:gap-14 items-center">
        
        {/* ===================== LEFT COLUMN (HEADLINE, VALUE PROPS & LOGO - DESKTOP ONLY) ===================== */}
        <div className="hidden xl:flex xl:col-span-6 flex-col justify-between py-4 space-y-10 lg:space-y-12">
          
          {/* Main Hero Headline */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-[#1E1E68] tracking-tight leading-[1.08]">
              Scan Fast.<br />
              Never Run Out.
            </h1>
          </div>

          {/* Feature List */}
          <div className="space-y-8 max-w-lg">
            
            {/* Feature 1: Instant Shelf Audits */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="mt-1 shrink-0">
                <svg
                  className="w-8 h-8 text-[#1E1E68]"
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
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-[#1E1E68] tracking-tight">
                  Instant Shelf Audits
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  Take one photo of a shelf and ShelfScan reads every product, counts stock and updates your inventory in seconds.
                </p>
              </div>
            </div>

            {/* Feature 2: Smart Reorder Alerts */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="mt-1 shrink-0">
                <svg
                  className="w-8 h-8 text-[#1E1E68]"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <rect
                    x="4"
                    y="6"
                    width="24"
                    height="15"
                    rx="4"
                    fill="currentColor"
                  />
                  <rect
                    x="9"
                    y="12"
                    width="14"
                    height="3"
                    rx="1.5"
                    fill="white"
                  />
                  <path
                    d="M4 25h24"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-[#1E1E68] tracking-tight">
                  Smart Reorder Alerts
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                  The reorder agent compares new photos with your last scan, flags low stock early and suggests what to order next.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Brand Mark: Assets Logo Image + "ShelfScan" */}
          <div className="pt-2 flex items-center gap-3">
            <img
              src={logoImg}
              alt="ShelfScan"
              className="w-10 h-10 rounded-xl object-contain shadow-xs shrink-0"
            />
            <span className="text-2xl font-black text-[#1E1E68] tracking-tight">
              ShelfScan
            </span>
          </div>
        </div>

        {/* ===================== RIGHT / CENTER COLUMN (LOGIN FORM) ===================== */}
        <div className="w-full min-h-screen sm:min-h-0 xl:col-span-6 flex justify-center xl:justify-end">
          <div className="w-full min-h-screen sm:min-h-0 sm:max-w-[420px] bg-white rounded-none sm:rounded-[32px] p-6 sm:p-10 shadow-none sm:shadow-xl shadow-slate-200/70 border-0 sm:border sm:border-slate-100 flex flex-col justify-center">
            
            <div className="w-full max-w-[360px] mx-auto my-auto py-4">
              {/* Centered App Logo from assets folder */}
              <div className="flex justify-center mb-4">
                <img
                  src={logoImg}
                  alt="ShelfScan Logo"
                  className="w-13 h-13 rounded-2xl object-contain shadow-xs drop-shadow-xs"
                />
              </div>

              {/* Header: "Welcome back" */}
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                  {isSignUp ? 'Create account' : 'Welcome back'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isSignUp ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false)
                          setErrorMsg('')
                        }}
                        className="text-[#6A3EC4] font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(true)
                          setErrorMsg('')
                        }}
                        className="text-[#6A3EC4] font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
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
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Full Name (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#5C3DAA] transition-all"
                    />
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#5C3DAA] transition-all"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#5C3DAA] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Role selection for Sign Up */}
                {isSignUp && (
                  <div className="pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('user')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          role === 'user'
                            ? 'bg-[#5C3DAA] text-white border-[#5C3DAA]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Staff User
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          role === 'admin'
                            ? 'bg-[#1E1E68] text-white border-[#1E1E68]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Store Admin
                      </button>
                    </div>
                  </div>
                )}

                {/* Terms agreement note: "By logging in you agree to our Terms of Use and Privacy Policy." */}
                <p className="text-[11px] text-slate-400 text-center leading-normal pt-1.5">
                  By logging in you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => alert('Terms of Use')}
                    className="text-[#6A3EC4] font-medium hover:underline cursor-pointer"
                  >
                    Terms of Use
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => alert('Privacy Policy')}
                    className="text-[#6A3EC4] font-medium hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>

                {/* Green Action Button: "Login" */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 px-4 bg-[#2DC46A] hover:bg-[#25ab5c] active:scale-[0.99] text-white font-medium text-sm rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Login'
                  )}
                </button>
              </form>


            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
