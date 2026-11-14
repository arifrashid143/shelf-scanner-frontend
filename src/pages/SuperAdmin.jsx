import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { api } from '../api/client'
import { createStatusOverrideHelper } from '../utils/statusOverrides'
import logoImg from '../assets/logo.png'
import {
  Building2,
  Store,
  Search,
  Plus,
  Power,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Edit2,
  MoreVertical,
  Copy,
} from 'lucide-react'

const { setOverride: setTenantStatusOverride, applyStatus: applyTenantStatus } =
  createStatusOverrideHelper('shelf_scanner_tenant_status_overrides')

export default function SuperAdmin({ user, onLogout }) {
  // User Profile Dropdown Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  // Live API data state (strictly GET /api/superadmin/tenants)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'SUSPENDED'
  const [planFilter, setPlanFilter] = useState('ALL') // 'ALL' | 'enterprise' | 'pro' | 'starter'

  // Modal States
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null)
  const [actionModalTenant, setActionModalTenant] = useState(null)

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

  // Fetch real data strictly from GET /api/superadmin/tenants
  const loadData = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      const tenantsData = await api.getSuperadminTenants()

      let rawList = []
      if (Array.isArray(tenantsData)) {
        rawList = tenantsData
      } else if (tenantsData?.items || tenantsData?.tenants) {
        rawList = tenantsData.items || tenantsData.tenants
      }

      // Normalize status and apply saved overrides across page refreshes
      setTenants(rawList.map(applyTenantStatus))
    } catch (err) {
      console.error('Superadmin tenants API load error:', err)
      setApiError(err.message || 'Failed to load tenants data from API.')
    } finally {
      setLoading(false)
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
  const userEmail =
    user?.email && user.email.includes('@')
      ? user.email
      : 'superadmin@platform.com'
  const userInitial = displayName.charAt(0).toUpperCase() || 'P'

  // Metric aggregates derived strictly from GET /api/superadmin/tenants
  const totalTenantsCount = tenants.length
  const activeTenantsCount = tenants.filter((t) => t.is_active).length
  const totalStoresCount = tenants.reduce(
    (acc, t) => acc + (Number(t.total_stores) || 0),
    0
  )

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

      // Preserve status override so refreshes remain consistent
      setTenantStatusOverride(selectedTenantForEdit.id, editForm.is_active)

      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenantForEdit.id
            ? { ...t, ...updated, is_active: editForm.is_active }
            : t
        )
      )
      showToast(`Tenant "${updated.name || selectedTenantForEdit.id}" updated successfully`, 'success')
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

      // Preserve status override so refreshes remain consistent
      setTenantStatusOverride(tenant.id, nextStatus)

      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id
            ? { ...t, ...updated, is_active: nextStatus }
            : t
        )
      )
      showToast(`Tenant "${tenant.name}" ${nextStatus ? 'activated' : 'suspended'}`, 'success')
    } catch (err) {
      showToast(err.message || `Failed to ${actionLabel} tenant`, 'error')
    } finally {
      setStatusToggleLoading((prev) => ({ ...prev, [tenant.id]: false }))
    }
  }

  const getPlanBadge = (tier) => {
    const t = (tier || '').toLowerCase()
    if (t === 'enterprise') return 'bg-fuchsia-100 text-fuchsia-800'
    if (t === 'pro') return 'bg-blue-100 text-blue-700'
    return 'bg-emerald-100 text-emerald-800'
  }

  return (
    <div className="min-h-screen w-full bg-[#EDEDED] font-sans text-slate-900 antialiased flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-md shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
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

      {/* ==================== TOP HEADER (MATCHING OTHER PAGES) ==================== */}
      <header className="h-14 w-full bg-[#3F4168] text-white shrink-0 z-30 flex items-center justify-between px-2.5 sm:px-3 border-b border-white/10 shadow-2xs select-none sticky top-0">
        {/* Left: Custom Brand Logo + Name + SUPERADMIN Badge */}
        <div className="flex items-center gap-2">
          <img
            src={logoImg}
            alt="Shelf Scanner"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain shrink-0 shadow-2xs"
          />
          <span className="font-bold text-base tracking-tight text-white select-none">
            Shelf Scanner
          </span>
          <span className="ml-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 tracking-wider">
            SUPERADMIN
          </span>
        </div>

        {/* Right: User Profile Avatar with dropdown */}
        <div className="relative shrink-0 flex items-center" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="relative w-8 h-8 rounded-full bg-[#d8c4d9] hover:bg-[#cdb6cf] text-[#4a3952] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="User profile menu"
            aria-expanded={isProfileMenuOpen}
          >
            <span>{userInitial}</span>
            {/* Active online green indicator dot on bottom right */}
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#52b757] ring-2 ring-[#3F4168]"
              title="Online"
            />
          </button>

          {/* Profile Dropdown Menu (Matching Provided Design) */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 bg-white rounded-md border border-slate-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 text-slate-900">
              {/* Top Section: User Avatar & Details */}
              <div className="p-4 sm:p-5 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#d8c4d9] text-[#4a3952] ring-4 ring-[#ecd8ec]/60 flex items-center justify-center font-black text-lg shadow-xs">
                    {userInitial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#52b757] ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                    {displayName}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                    {userEmail}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                    Platform Superadmin · Root
                  </span>
                </div>
              </div>

              {/* Divider Line */}
              <div className="border-t border-slate-100"></div>

              {/* Bottom Section: Log Out Button */}
              <div className="p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer group text-left"
                >
                  <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-100 transition-colors">
                    <LogOut className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-bold text-rose-600">
                    Log out
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ==================== MAIN SINGLE-PAGE BODY ==================== */}
      <main className="flex-1 w-full px-2 sm:px-2.5 md:px-3 py-2.5 md:py-3 space-y-3">
        {/* Error Alert from API if any */}
        {apiError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs cursor-pointer font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================== 3 TOP METRIC CARDS (EXACT MATCH TO PHOTO) ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Card 1: TENANTS */}
          <div className="bg-white p-5 rounded-md border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                TENANTS
              </span>
              <Building2 className="w-5 h-5 text-purple-400/90" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2.5">
              {loading && tenants.length === 0 ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                totalTenantsCount
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Total companies</p>
          </div>

          {/* Card 2: ACTIVE */}
          <div className="bg-white p-5 rounded-md border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ACTIVE
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500/90" />
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2.5 flex items-baseline gap-1">
              {loading && tenants.length === 0 ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                <>
                  <span>{activeTenantsCount}</span>
                  <span className="text-slate-400 font-medium text-lg">/{totalTenantsCount}</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Operational</p>
          </div>

          {/* Card 3: STORES */}
          <div className="bg-white p-5 rounded-md border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                STORES
              </span>
              <Store className="w-5 h-5 text-purple-400/90" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2.5">
              {loading && tenants.length === 0 ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                totalStoresCount
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Across all tenants</p>
          </div>
        </div>

        {/* ==================== TENANT COMPANIES DIRECTORY (EXACT MATCH TO PHOTO) ==================== */}
        <div className="bg-white rounded-md border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Header & Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Tenant Companies Directory
              </h2>
            </div>

            {/* Search, Filters & Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px] sm:min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by company, slug, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200/90 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
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

              {/* Status Segmented Control */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SUSPENDED')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    statusFilter === 'SUSPENDED'
                      ? 'bg-white text-rose-700 shadow-2xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Suspended
                </button>
              </div>

              {/* Plan Tier Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200/90 bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
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
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white">
                  <th className="px-5 py-4">COMPANY NAME</th>
                  <th className="px-4 py-4">TENANT ID</th>
                  <th className="px-4 py-4">SLUG</th>
                  <th className="px-4 py-4 text-center">PLAN TIER</th>
                  <th className="px-4 py-4 text-center">STORES</th>
                  <th className="px-4 py-4 text-center">USERS</th>
                  <th className="px-4 py-4 text-center">SCANS</th>
                  <th className="px-4 py-4 text-center">STATUS</th>
                  <th className="px-4 py-4">CREATED AT</th>
                  <th className="px-5 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading && tenants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      <span>Loading tenants…</span>
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
                      <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Company Name */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                              {initial}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{tenant.name}</span>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-4 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {tenant.id}
                        </td>

                        {/* Slug */}
                        <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                          /{String(tenant.slug || '').replace(/^\//, '')}
                        </td>

                        {/* Plan Tier */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getPlanBadge(
                              tenant.plan_tier
                            )}`}
                          >
                            {tenant.plan_tier || 'ENTERPRISE'}
                          </span>
                        </td>

                        {/* Total Stores */}
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-xs">
                          {tenant.total_stores ?? 0}
                        </td>

                        {/* Total Users */}
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-xs">
                          {tenant.total_users ?? 0}
                        </td>

                        {/* Total Scans */}
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 text-xs">
                          {tenant.total_scans ?? 0}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {tenant.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {tenant.created_at
                            ? new Date(tenant.created_at).toLocaleDateString('en-US')
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setActionModalTenant(tenant)}
                              disabled={isBusy}
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:bg-slate-200 transition-colors cursor-pointer"
                              title={`Actions for ${tenant.name}`}
                              aria-label={`Actions for ${tenant.name}`}
                            >
                              {isBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              ) : (
                                <MoreVertical className="w-4 h-4 stroke-[2]" />
                              )}
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
          <div className="bg-white rounded-md max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
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
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-md flex items-center gap-2">
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
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors font-medium"
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
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-md border border-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
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
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-md border border-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
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
                          className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all border cursor-pointer ${
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
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
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
                        className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
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
                  className="px-4 py-2.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-60"
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
          <div className="bg-white rounded-md max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
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
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:border-blue-500"
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
                      className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all border cursor-pointer ${
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
                    className={`py-2.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
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
                    className={`py-2.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
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
                  className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
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
      {/* ==================== TENANT ACTIONS MODAL (THREE DOTS MENU) ==================== */}
      {actionModalTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-md max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                  {(actionModalTenant.name || actionModalTenant.id || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {actionModalTenant.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalTenant.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalTenant(null)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tenant Meta Badges */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                {actionModalTenant.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Suspended
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Plan:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getPlanBadge(
                    actionModalTenant.plan_tier
                  )}`}
                >
                  {actionModalTenant.plan_tier || 'ENTERPRISE'}
                </span>
              </div>
            </div>

            {/* Options List */}
            <div className="p-3 space-y-1.5">
              {/* Option 1: Edit Tenant Details & Plan */}
              <button
                type="button"
                onClick={() => {
                  const t = actionModalTenant
                  setActionModalTenant(null)
                  openEditModal(t)
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    Edit Details & Plan Tier
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Update company name, plan tier, or status
                  </p>
                </div>
              </button>

              {/* Option 2: Toggle Status (Activate / Suspend) */}
              <button
                type="button"
                disabled={statusToggleLoading[actionModalTenant.id]}
                onClick={async () => {
                  const t = actionModalTenant
                  setActionModalTenant(null)
                  await handleQuickToggleStatus(t)
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-md text-left transition-colors cursor-pointer border border-transparent group ${
                  actionModalTenant.is_active
                    ? 'hover:bg-rose-50/70 hover:border-rose-200'
                    : 'hover:bg-emerald-50/70 hover:border-emerald-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    actionModalTenant.is_active
                      ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                  }`}
                >
                  {actionModalTenant.is_active ? (
                    <Power className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold ${
                      actionModalTenant.is_active
                        ? 'text-slate-900 group-hover:text-rose-700'
                        : 'text-slate-900 group-hover:text-emerald-700'
                    }`}
                  >
                    {actionModalTenant.is_active ? 'Suspend Tenant Access' : 'Activate Tenant Access'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {actionModalTenant.is_active
                      ? 'Disable tenant and employee platform access'
                      : 'Restore full platform permissions'}
                  </p>
                </div>
              </button>

              {/* Option 3: Copy Tenant ID */}
              <button
                type="button"
                onClick={() => {
                  if (actionModalTenant?.id) {
                    navigator.clipboard?.writeText(actionModalTenant.id)
                    showToast(`Tenant ID "${actionModalTenant.id}" copied!`, 'success')
                    setActionModalTenant(null)
                  }
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                    Copy Tenant ID
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalTenant.id}
                  </p>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActionModalTenant(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
