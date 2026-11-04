import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { api } from '../api/client'
import logoImg from '../assets/logo.png'
import {
  Building2,
  Users,
  Store,
  Scan,
  Coins,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Power,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Edit2,
  ChevronDown,
} from 'lucide-react'

export default function SuperAdminView({ user, onLogout }) {
  // User Profile Dropdown Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  // Live API data state
  const [tenants, setTenants] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'SUSPENDED'
  const [planFilter, setPlanFilter] = useState('ALL') // 'ALL' | 'enterprise' | 'pro' | 'starter'

  // Modal States
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null)

  // Form State: POST /api/superadmin/tenants
  const [createForm, setCreateForm] = useState({
    name: '',
    id: '',
    slug: '',
    plan_tier: 'enterprise',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  })
  const [createErrors, setCreateErrors] = useState({})
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  // Form State: PUT /api/superadmin/tenants/{tenant_id}/status
  const [editForm, setEditForm] = useState({
    name: '',
    plan_tier: 'enterprise',
    is_active: true,
  })
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [statusToggleLoading, setStatusToggleLoading] = useState({})

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch real data from Superadmin APIs
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setApiError(null)

    try {
      const [analyticsData, tenantsData] = await Promise.all([
        api.getSuperadminAnalytics(),
        api.getSuperadminTenants(),
      ])

      if (analyticsData) {
        setAnalytics(analyticsData)
      }

      if (Array.isArray(tenantsData)) {
        setTenants(tenantsData)
      } else if (tenantsData?.items || tenantsData?.tenants) {
        setTenants(tenantsData.items || tenantsData.tenants)
      } else {
        setTenants([])
      }
    } catch (err) {
      console.error('Superadmin API load error:', err)
      setApiError(err.message || 'Failed to load data from Superadmin APIs.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Close profile dropdown menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const displayName = user?.full_name || user?.name || 'Platform Superadmin'
  const userEmail = user?.email || 'superadmin'
  const userInitial = displayName.charAt(0).toUpperCase() || 'S'

  // Format currency
  const formatCurrency = (val) => {
    const num = Number(val) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Auto-slugify tenant name
  const handleNameChange = (e) => {
    const val = e.target.value
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setCreateForm((prev) => ({
      ...prev,
      name: val,
      id: prev.id === '' || prev.id === prev.slug ? slugified : prev.id,
      slug: slugified,
    }))
  }

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const q = searchTerm.toLowerCase().trim()
      const matchSearch =
        !q ||
        tenant.name?.toLowerCase().includes(q) ||
        tenant.id?.toLowerCase().includes(q) ||
        tenant.slug?.toLowerCase().includes(q)

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && tenant.is_active) ||
        (statusFilter === 'SUSPENDED' && !tenant.is_active)

      const matchPlan =
        planFilter === 'ALL' ||
        tenant.plan_tier?.toLowerCase() === planFilter.toLowerCase()

      return matchSearch && matchStatus && matchPlan
    })
  }, [tenants, searchTerm, statusFilter, planFilter])

  // Validate onboarding form
  const validateCreateForm = () => {
    const errors = {}
    if (!createForm.name.trim()) errors.name = 'Company Name is required'
    if (!createForm.id.trim()) errors.id = 'Tenant ID is required'
    if (!createForm.slug.trim()) errors.slug = 'Slug is required'
    if (!createForm.admin_name.trim()) errors.admin_name = 'Admin Name is required'
    if (!createForm.admin_email.trim()) {
      errors.admin_email = 'Admin Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(createForm.admin_email)) {
      errors.admin_email = 'Valid Admin Email is required'
    }
    if (!createForm.admin_password) {
      errors.admin_password = 'Admin Password is required'
    } else if (createForm.admin_password.length < 6) {
      errors.admin_password = 'Password must be at least 6 characters'
    }
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  // POST /api/superadmin/tenants (Create Tenant & Provision Admin)
  const handleOnboardSubmit = async (e) => {
    e.preventDefault()
    if (!validateCreateForm()) return

    setIsSubmittingCreate(true)
    try {
      const payload = {
        id: createForm.id.trim(),
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        plan_tier: createForm.plan_tier,
        admin_email: createForm.admin_email.trim(),
        admin_password: createForm.admin_password,
        admin_name: createForm.admin_name.trim(),
      }

      const created = await api.createSuperadminTenant(payload)
      setTenants((prev) => [created, ...prev.filter((t) => t.id !== created.id)])
      showToast(`Tenant "${created.name}" created and Admin provisioned!`, 'success')

      // Refresh live analytics
      api.getSuperadminAnalytics().then((res) => res && setAnalytics(res)).catch(() => {})

      setIsOnboardModalOpen(false)
      setCreateForm({
        name: '',
        id: '',
        slug: '',
        plan_tier: 'enterprise',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      })
      setCreateErrors({})
    } catch (err) {
      setCreateErrors((prev) => ({
        ...prev,
        server: err.message || 'Failed to onboard tenant via API',
      }))
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (tenant) => {
    setSelectedTenantForEdit(tenant)
    setEditForm({
      name: tenant.name || '',
      plan_tier: tenant.plan_tier || 'enterprise',
      is_active: Boolean(tenant.is_active),
    })
  }

  // PUT /api/superadmin/tenants/{tenant_id}/status (Update Status & Details)
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTenantForEdit) return

    setIsSubmittingEdit(true)
    try {
      const updated = await api.updateSuperadminTenantStatus(selectedTenantForEdit.id, {
        name: editForm.name.trim() || undefined,
        plan_tier: editForm.plan_tier,
        is_active: editForm.is_active,
      })

      setTenants((prev) =>
        prev.map((t) => (t.id === selectedTenantForEdit.id ? { ...t, ...updated } : t))
      )
      showToast(`Tenant "${updated.name || selectedTenantForEdit.id}" updated successfully`, 'success')

      // Refresh analytics
      api.getSuperadminAnalytics().then((res) => res && setAnalytics(res)).catch(() => {})
      setSelectedTenantForEdit(null)
    } catch (err) {
      showToast(err.message || 'Failed to update tenant status', 'error')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Quick toggle status via PUT /api/superadmin/tenants/{tenant_id}/status
  const handleQuickToggleStatus = async (tenant) => {
    const nextStatus = !tenant.is_active
    const actionLabel = nextStatus ? 'activate' : 'suspend'

    if (!window.confirm(`Are you sure you want to ${actionLabel} tenant "${tenant.name}"?`)) {
      return
    }

    setStatusToggleLoading((prev) => ({ ...prev, [tenant.id]: true }))
    try {
      const updated = await api.updateSuperadminTenantStatus(tenant.id, {
        is_active: nextStatus,
      })
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, ...updated } : t))
      )
      showToast(`Tenant "${tenant.name}" ${nextStatus ? 'activated' : 'suspended'}`, 'success')
      api.getSuperadminAnalytics().then((res) => res && setAnalytics(res)).catch(() => {})
    } catch (err) {
      showToast(err.message || `Failed to ${actionLabel} tenant`, 'error')
    } finally {
      setStatusToggleLoading((prev) => ({ ...prev, [tenant.id]: false }))
    }
  }

  const getPlanBadge = (tier) => {
    const t = (tier || '').toLowerCase()
    if (t === 'enterprise') return 'bg-purple-100 text-purple-800 border-purple-200'
    if (t === 'pro') return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 antialiased flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 border-rose-700'
              : toastMessage.type === 'success'
              ? 'bg-emerald-900 border-emerald-700'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'error'
                ? 'bg-rose-400'
                : toastMessage.type === 'success'
                ? 'bg-emerald-400'
                : 'bg-blue-400'
            }`}
          ></span>
          {toastMessage.text}
        </div>
      )}

      {/* ==================== SINGLE-PAGE TOP NAVIGATION BAR (NO SIDEBAR) ==================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Shelf Scanner Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-2xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                  Shelf Scanner
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldCheck className="w-3 h-3 text-amber-700" /> Superadmin
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Platform Management
              </p>
            </div>
          </div>

          {/* Right Header Actions: Refresh & User Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Refresh Live API Data Button */}
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Refresh live Superadmin API data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* User Profile Icon with Dropdown Menu (Right Corner of Header) */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 sm:pr-2.5 rounded-full sm:rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                aria-label="User profile menu"
                aria-expanded={isProfileMenuOpen}
              >
                {/* Profile Icon Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold leading-tight">
                    Superadmin
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180 text-amber-600' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* User Profile Information */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-100">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 truncate leading-tight">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5" title={userEmail}>
                        {userEmail}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        Platform Superadmin
                      </div>
                    </div>
                  </div>

                  {/* Access Scope Info */}
                  <div className="px-4 py-2.5 text-[11px] text-slate-500 bg-slate-50/70 border-b border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Access Scope</span>
                      <span className="font-bold text-slate-800">Platform Tenants</span>
                    </div>
                    {user?.id && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500">User ID</span>
                        <span className="font-mono text-slate-700 text-[10px] truncate max-w-[140px]">{user.id}</span>
                      </div>
                    )}
                  </div>

                  {/* Log Out Action in Profile Menu */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        onLogout()
                      }}
                      className="w-full py-2 px-3 rounded-xl hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ==================== MAIN SINGLE-PAGE BODY ==================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert from API if any */}
        {apiError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs cursor-pointer font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================== SECTION 1: PLATFORM ANALYTICS (GET /api/superadmin/analytics) ==================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Platform Analytics Overview
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              GET /api/superadmin/analytics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1: Total Tenants */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tenants</span>
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {loading && !analytics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  analytics?.total_tenants ?? 0
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Total companies</p>
            </div>

            {/* Card 2: Active Tenants */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1">
                {loading && !analytics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  analytics?.active_tenants ?? 0
                )}
                {analytics?.total_tenants !== undefined && (
                  <span className="text-xs text-slate-400 font-semibold">
                    /{analytics.total_tenants}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5 truncate font-medium">Operational</p>
            </div>

            {/* Card 3: Total Stores */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stores</span>
                <Store className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {loading && !analytics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  analytics?.total_stores ?? 0
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Across all tenants</p>
            </div>

            {/* Card 4: Total Users */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Users</span>
                <Users className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {loading && !analytics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  analytics?.total_users ?? 0
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Admins & Staff</p>
            </div>

            {/* Card 5: Total Scans */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shelf Scans</span>
                <Scan className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {loading && !analytics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  analytics?.total_scans ?? 0
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Platform audits</p>
            </div>

            {/* Card 6: PO Volume */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PO Value</span>
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {loading && !analytics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  formatCurrency(analytics?.total_purchase_orders_value ?? 0)
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Reorders Managed</p>
            </div>
          </div>
        </div>

        {/* ==================== SECTION 2: TENANTS MANAGEMENT (GET /api/superadmin/tenants) ==================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Header & Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-slate-800" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Tenant Companies Directory
                  </h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {filteredTenants.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  GET /api/superadmin/tenants
                </p>
              </div>
            </div>

            {/* Search, Filters & Action Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by company, slug, ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SUSPENDED')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'SUSPENDED' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Suspended
                </button>
              </div>

              {/* Plan Tier Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Plans</option>
                <option value="enterprise">Enterprise</option>
                <option value="pro">Pro</option>
                <option value="starter">Starter</option>
              </select>

              {/* Primary Action Button: Onboard Tenant */}
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Tenant</span>
              </button>
            </div>
          </div>

          {/* Table of Tenants (strictly from GET /api/superadmin/tenants) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="px-5 py-3.5">Company Name</th>
                  <th className="px-4 py-3.5 font-mono">Tenant ID</th>
                  <th className="px-4 py-3.5 font-mono">Slug</th>
                  <th className="px-4 py-3.5">Plan Tier</th>
                  <th className="px-4 py-3.5 text-center">Stores</th>
                  <th className="px-4 py-3.5 text-center">Users</th>
                  <th className="px-4 py-3.5 text-center">Scans</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5">Created At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading && tenants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      <span>Loading tenants from GET /api/superadmin/tenants…</span>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No tenants found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Use &quot;Onboard Tenant&quot; above to create and provision a new company.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const isBusy = statusToggleLoading[tenant.id]
                    const initial = (tenant.name || tenant.id || 'T').charAt(0).toUpperCase()

                    return (
                      <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Company Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-200">
                              {initial}
                            </div>
                            <span className="font-bold text-slate-900">{tenant.name}</span>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          {tenant.id}
                        </td>

                        {/* Slug */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          /{tenant.slug}
                        </td>

                        {/* Plan Tier */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getPlanBadge(
                              tenant.plan_tier
                            )}`}
                          >
                            {tenant.plan_tier || 'Enterprise'}
                          </span>
                        </td>

                        {/* Total Stores */}
                        <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                          {tenant.total_stores ?? 0}
                        </td>

                        {/* Total Users */}
                        <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                          {tenant.total_users ?? 0}
                        </td>

                        {/* Total Scans */}
                        <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                          {tenant.total_scans ?? 0}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          {tenant.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                          {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Status (PUT /api/superadmin/tenants/{tenant_id}/status) */}
                            <button
                              type="button"
                              onClick={() => handleQuickToggleStatus(tenant)}
                              disabled={isBusy}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                tenant.is_active
                                  ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                  : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={tenant.is_active ? 'Suspend Tenant' : 'Activate Tenant'}
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {tenant.is_active ? 'Suspend' : 'Activate'}
                              </span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(tenant)}
                              className="p-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit tenant details and status"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ==================== ONBOARD NEW TENANT MODAL (POST /api/superadmin/tenants) ==================== */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Onboard New Retail Tenant
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    POST /api/superadmin/tenants
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-5 sm:p-6 space-y-4">
              {createErrors.server && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{createErrors.server}</span>
                </div>
              )}

              {/* Section 1: Tenant Organization */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Company Details
                </h4>
                <div className="space-y-3">
                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Metro Mart Hypermarkets"
                      value={createForm.name}
                      onChange={handleNameChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-medium"
                    />
                    {createErrors.name && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1">
                        {createErrors.name}
                      </p>
                    )}
                  </div>

                  {/* ID & Slug */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tenant ID *
                      </label>
                      <input
                        type="text"
                        placeholder="metro-mart"
                        value={createForm.id}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, id: e.target.value.toLowerCase().trim() }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      {createErrors.id && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          {createErrors.id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Slug *
                      </label>
                      <input
                        type="text"
                        placeholder="metro-mart"
                        value={createForm.slug}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, slug: e.target.value.toLowerCase().trim() }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      {createErrors.slug && (
                        <p className="text-[11px] text-rose-600 font-bold mt-1">
                          {createErrors.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Plan Tier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plan Tier
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['enterprise', 'pro', 'starter'].map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setCreateForm((p) => ({ ...p, plan_tier: tier }))}
                          className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
                            createForm.plan_tier === tier
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Provision Initial Tenant Admin */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Initial Tenant Admin
                </h4>
                <div className="space-y-3">
                  {/* Admin Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Marcus Brody"
                      value={createForm.admin_name}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, admin_name: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {createErrors.admin_name && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1">
                        {createErrors.admin_name}
                      </p>
                    )}
                  </div>

                  {/* Admin Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      placeholder="admin@metromart.com"
                      value={createForm.admin_email}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, admin_email: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {createErrors.admin_email && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1">
                        {createErrors.admin_email}
                      </p>
                    )}
                  </div>

                  {/* Admin Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={createForm.admin_password}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, admin_password: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAdminPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    {createErrors.admin_password && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1">
                        {createErrors.admin_password}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-60"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Tenant & Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT STATUS & PLAN MODAL (PUT /api/superadmin/tenants/{tenant_id}/status) ==================== */}
      {selectedTenantForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Update Tenant Status & Plan
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  PUT /api/superadmin/tenants/{selectedTenantForEdit.id}/status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenantForEdit(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Plan Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['enterprise', 'pro', 'starter'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, plan_tier: tier }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
                        editForm.plan_tier === tier
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active / Suspended Status Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tenant Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, is_active: true }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      editForm.is_active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, is_active: false }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      !editForm.is_active
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Suspended</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
