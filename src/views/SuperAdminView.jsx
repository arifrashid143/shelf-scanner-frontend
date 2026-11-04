import { useState, useMemo } from 'react'
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
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react'

export default function SuperAdminView({
  tenants = [],
  analytics = null,
  isLoading = false,
  onCreateTenant,
  onUpdateTenantStatus,
  onRefresh,
  onShowToast,
}) {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'SUSPENDED'
  const [planFilter, setPlanFilter] = useState('ALL') // 'ALL' | 'enterprise' | 'pro' | 'starter'

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null)
  const [selectedTenantForView, setSelectedTenantForView] = useState(null)

  // Form state for Onboarding New Tenant (POST /api/superadmin/tenants)
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

  // Form state for Updating Status & Plan (PUT /api/superadmin/tenants/{tenant_id}/status)
  const [editForm, setEditForm] = useState({
    name: '',
    plan_tier: 'enterprise',
    is_active: true,
  })
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Quick status toggle loading map
  const [statusToggleLoading, setStatusToggleLoading] = useState({})

  // Format currency
  const formatCurrency = (val) => {
    const num = Number(val) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Auto-slugify tenant name to ID and Slug
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

  // Handle Onboard Tenant Submit (POST /api/superadmin/tenants)
  const handleOnboardSubmit = async (e) => {
    e.preventDefault()
    if (!validateCreateForm()) return

    setIsSubmittingCreate(true)
    try {
      await onCreateTenant({
        id: createForm.id.trim(),
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        plan_tier: createForm.plan_tier,
        admin_email: createForm.admin_email.trim(),
        admin_password: createForm.admin_password,
        admin_name: createForm.admin_name.trim(),
      })
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
        server: err.message || 'Failed to onboard tenant',
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

  // Handle Update Status Submit (PUT /api/superadmin/tenants/{tenant_id}/status)
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTenantForEdit) return

    setIsSubmittingEdit(true)
    try {
      await onUpdateTenantStatus(selectedTenantForEdit.id, {
        name: editForm.name.trim() || undefined,
        plan_tier: editForm.plan_tier,
        is_active: editForm.is_active,
      })
      setSelectedTenantForEdit(null)
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to update tenant', 'error')
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Handle Quick Status Toggle (PUT /api/superadmin/tenants/{tenant_id}/status)
  const handleQuickToggleStatus = async (tenant, e) => {
    e.stopPropagation()
    const nextStatus = !tenant.is_active
    const actionLabel = nextStatus ? 'activate' : 'suspend'

    if (!window.confirm(`Are you sure you want to ${actionLabel} tenant "${tenant.name}"?`)) {
      return
    }

    setStatusToggleLoading((prev) => ({ ...prev, [tenant.id]: true }))
    try {
      await onUpdateTenantStatus(tenant.id, {
        is_active: nextStatus,
      })
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || `Failed to ${actionLabel} tenant`, 'error')
      }
    } finally {
      setStatusToggleLoading((prev) => ({ ...prev, [tenant.id]: false }))
    }
  }

  // Plan tier badge style
  const getPlanBadge = (tier) => {
    const t = (tier || '').toLowerCase()
    if (t === 'enterprise') {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    if (t === 'pro') {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }

  return (
    <div className="space-y-5 pb-12">
      {/* ==================== HEADER BAR ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Superadmin Platform Management
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                  Global SaaS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage tenant companies, onboard retail chains, provision tenant admins, and monitor platform metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Refresh tenants and platform analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOnboardModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Tenant</span>
          </button>
        </div>
      </div>

      {/* ==================== SECURITY & ISOLATION BANNER ==================== */}
      <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
          <Layers className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed text-slate-600">
          <p className="font-bold text-amber-900 text-xs sm:text-sm">
            Tenant Isolation & Superadmin Role Boundary
          </p>
          <p className="mt-0.5">
            As a Superadmin, you have full authority to onboard tenant companies, activate/suspend organizations, and provision Tenant Admins via the backend <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-amber-950">/api/superadmin/tenants</code> endpoints. Store-specific shelf scans, local warehouse stock, and purchase orders are strictly partitioned within tenant boundaries and are not accessible to platform superadmins.
          </p>
        </div>
      </div>

      {/* ==================== ANALYTICS KPI CARDS (GET /api/superadmin/analytics) ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Tenants */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tenants</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {isLoading && !analytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                analytics?.total_tenants ?? tenants.length
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {analytics?.active_tenants ?? tenants.filter((t) => t.is_active).length} active
          </p>
        </div>

        {/* Active Tenants */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {isLoading && !analytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                analytics?.active_tenants ?? tenants.filter((t) => t.is_active).length
              )}
            </span>
            {analytics && (
              <span className="text-xs text-slate-400 font-semibold">
                /{analytics.total_tenants}
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 truncate font-medium">
            Operational
          </p>
        </div>

        {/* Total Stores */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stores</span>
            <Store className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {isLoading && !analytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                analytics?.total_stores ?? 0
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Across all tenants</p>
        </div>

        {/* Total Users */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Users</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {isLoading && !analytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                analytics?.total_users ?? 0
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Admins & Staff</p>
        </div>

        {/* Total Scans */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shelf Scans</span>
            <Scan className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {isLoading && !analytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                analytics?.total_scans ?? 0
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Platform audits</p>
        </div>

        {/* Total PO Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PO Volume</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {isLoading && !analytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                formatCurrency(analytics?.total_purchase_orders_value ?? 0)
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Platform Reorders</p>
        </div>
      </div>

      {/* ==================== TENANTS DIRECTORY ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Tenant Companies Directory
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {filteredTenants.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by company, slug, or ID…"
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
          </div>
        </div>

        {/* Tenants Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/70">
                <th className="px-5 py-3.5">Company / Tenant</th>
                <th className="px-4 py-3.5">Plan Tier</th>
                <th className="px-4 py-3.5 text-center">Stores</th>
                <th className="px-4 py-3.5 text-center">Users</th>
                <th className="px-4 py-3.5 text-center">Shelf Scans</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading platform tenants…</span>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No tenants matched your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try clearing filters or click &quot;Onboard New Tenant&quot; to provision a new company.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const initial = (tenant.name || tenant.id || 'T').charAt(0).toUpperCase()
                  const isToggleBusy = statusToggleLoading[tenant.id]

                  return (
                    <tr
                      key={tenant.id}
                      onClick={() => setSelectedTenantForView(tenant)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Company Name & Slug */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs group-hover:border-blue-300 group-hover:text-blue-700 transition-colors">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{tenant.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                              <span>id: {tenant.id}</span>
                              <span>•</span>
                              <span>/{tenant.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Tier */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getPlanBadge(
                            tenant.plan_tier
                          )}`}
                        >
                          {tenant.plan_tier || 'Enterprise'}
                        </span>
                      </td>

                      {/* Stores Count */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {tenant.total_stores ?? 0}
                      </td>

                      {/* Users Count */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {tenant.total_users ?? 0}
                      </td>

                      {/* Shelf Scans Count */}
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

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Toggle Status (PUT /api/superadmin/tenants/{tenant_id}/status) */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickToggleStatus(tenant, e)}
                            disabled={isToggleBusy}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              tenant.is_active
                                ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={tenant.is_active ? 'Suspend Tenant' : 'Activate Tenant'}
                          >
                            {isToggleBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {tenant.is_active ? 'Suspend' : 'Activate'}
                            </span>
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => openEditModal(tenant)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Edit
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

      {/* ==================== ONBOARD NEW TENANT MODAL (POST /api/superadmin/tenants) ==================== */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Onboard New Retail Tenant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provisions company workspace and initial Tenant Administrator
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

              {/* Section 1: Company / Organization */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Company Information
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

                  {/* ID & Slug Grid */}
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

              {/* Section 2: Initial Tenant Admin Provisioning */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Initial Tenant Admin Provisioning
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
                      Admin Email Address *
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
                      Initial Temporary Password *
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
                        {showAdminPassword ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
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

      {/* ==================== EDIT TENANT STATUS MODAL (PUT /api/superadmin/tenants/{tenant_id}/status) ==================== */}
      {selectedTenantForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Update Tenant Status & Plan
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {selectedTenantForEdit.id}
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

              {/* Action Buttons */}
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

      {/* ==================== VIEW TENANT DETAILS DRAWER / MODAL ==================== */}
      {selectedTenantForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {(selectedTenantForView.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {selectedTenantForView.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>id: {selectedTenantForView.id}</span>
                    <span>•</span>
                    <span>slug: {selectedTenantForView.slug}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenantForView(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Tenant Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Stores</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedTenantForView.total_stores ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Users</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedTenantForView.total_users ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Shelf Scans</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedTenantForView.total_scans ?? 0}
                  </p>
                </div>
              </div>

              {/* Status & Plan Info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Current Status</span>
                  {selectedTenantForView.is_active ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Subscription Plan</span>
                  <span
                    className={`font-extrabold uppercase px-2 py-0.5 rounded-md text-[10px] border ${getPlanBadge(
                      selectedTenantForView.plan_tier
                    )}`}
                  >
                    {selectedTenantForView.plan_tier || 'Enterprise'}
                  </span>
                </div>
                {selectedTenantForView.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Onboarded On</span>
                    <span className="font-medium text-slate-700">
                      {new Date(selectedTenantForView.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedTenantForView
                    setSelectedTenantForView(null)
                    openEditModal(t)
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Edit Tenant Plan & Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

