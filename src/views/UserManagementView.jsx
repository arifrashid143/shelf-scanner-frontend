import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Store,
  RefreshCw,
  Mail,
  User as UserIcon,
} from 'lucide-react'

// Realistic initial fallback data for instant demo / offline support
const initialFallbackUsers = [
  {
    id: 1,
    full_name: 'Sarah Connor',
    email: 'sarah.connor@shelfscanner.com',
    role: 'STORE_ADMIN',
    store_id: 'store_main',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 2,
    full_name: 'Jordan Lee',
    email: 'jordan.lee@shelfscanner.com',
    role: 'USER',
    store_id: 'store_main',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 3,
    full_name: 'Alex Rivera',
    email: 'alex.rivera@shelfscanner.com',
    role: 'USER',
    store_id: 'store_north',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 4,
    full_name: 'David Kim',
    email: 'david.kim@shelfscanner.com',
    role: 'USER',
    store_id: 'store_main',
    is_active: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
]

export default function UserManagementView({ isAdmin, currentUser, onShowToast }) {
  const [users, setUsers] = useState(initialFallbackUsers)
  const [stores, setStores] = useState([
    { id: 'store_main', name: 'Main Store' },
    { id: 'store_north', name: 'North Branch' },
  ])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL') // ALL | ADMIN | USER
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | ACTIVE | INACTIVE

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'USER',
    store_id: 'store_main',
  })
  const [createErrors, setCreateErrors] = useState({})
  const [createTouched, setCreateTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createApiError, setCreateApiError] = useState('')

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'USER',
    store_id: '',
    is_active: true,
    password: '',
  })
  const [updating, setUpdating] = useState(false)
  const [editApiError, setEditApiError] = useState('')

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    setErrorMsg('')

    try {
      const [usersRes, storesRes] = await Promise.all([
        api.getTenantUsers().catch((err) => {
          console.warn('GET /api/tenant/users failed, using fallback:', err.message)
          return null
        }),
        api.getTenantStores().catch(() => []),
      ])

      if (Array.isArray(usersRes)) {
        setUsers(usersRes)
      } else if (usersRes?.users || usersRes?.items) {
        setUsers(usersRes.users || usersRes.items)
      }

      if (Array.isArray(storesRes) && storesRes.length > 0) {
        setStores(storesRes)
      }
    } catch (err) {
      console.error('Error fetching tenant users:', err)
      setErrorMsg('Could not fetch company users from server. Showing cached users.')
    } finally {
      setRefreshing(false)
    }
  }

  // Initial load from Tenant Administration API
  useEffect(() => {
    let isSubscribed = true
    async function initData() {
      try {
        const [usersRes, storesRes] = await Promise.all([
          api.getTenantUsers().catch(() => null),
          api.getTenantStores().catch(() => []),
        ])

        if (!isSubscribed) return

        if (Array.isArray(usersRes)) {
          setUsers(usersRes)
        } else if (usersRes?.users || usersRes?.items) {
          setUsers(usersRes.users || usersRes.items)
        }

        if (Array.isArray(storesRes) && storesRes.length > 0) {
          setStores(storesRes)
        }
      } catch (err) {
        if (isSubscribed) {
          console.error('Error fetching tenant users:', err)
        }
      } finally {
        if (isSubscribed) {
          setLoading(false)
        }
      }
    }

    initData()
    return () => {
      isSubscribed = false
    }
  }, [])

  // Validation logic for Create User
  const validateField = (field, value) => {
    let err = ''
    if (field === 'full_name') {
      const val = (value || '').trim()
      if (!val) err = 'Full name is required'
      else if (val.length < 2) err = 'Name must be at least 2 characters'
    } else if (field === 'email') {
      const val = (value || '').trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
      if (!val) err = 'Email address is required'
      else if (!emailRegex.test(val)) err = 'Please enter a valid email address'
    } else if (field === 'password') {
      if (!value) err = 'Password is required'
      else if (value.length < 6) err = 'Password must be at least 6 characters'
    }
    return err
  }

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
    if (createTouched[field] || createErrors[field]) {
      const err = validateField(field, value)
      setCreateErrors((prev) => ({ ...prev, [field]: err }))
    }
  }

  const handleCreateBlur = (field) => {
    setCreateTouched((prev) => ({ ...prev, [field]: true }))
    const err = validateField(field, createForm[field])
    setCreateErrors((prev) => ({ ...prev, [field]: err }))
  }

  // Handle Create User Submit (POST /api/tenant/users)
  const handleCreateUser = async (e) => {
    e?.preventDefault()
    setCreateApiError('')

    const nameErr = validateField('full_name', createForm.full_name)
    const emailErr = validateField('email', createForm.email)
    const pwdErr = validateField('password', createForm.password)

    const errors = {}
    if (nameErr) errors.full_name = nameErr
    if (emailErr) errors.email = emailErr
    if (pwdErr) errors.password = pwdErr

    setCreateTouched({ full_name: true, email: true, password: true })
    setCreateErrors(errors)

    if (Object.keys(errors).length > 0) return

    setCreating(true)
    try {
      const payload = {
        email: createForm.email.trim(),
        password: createForm.password,
        full_name: createForm.full_name.trim(),
        role: createForm.role,
        store_id: createForm.store_id || null,
      }

      const res = await api.createTenantUser(payload)
      const createdUser = res?.user || res || {
        id: Date.now(),
        ...payload,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      setUsers((prev) => [createdUser, ...prev.filter((u) => u.id !== createdUser.id)])
      setIsCreateModalOpen(false)
      setCreateForm({
        full_name: '',
        email: '',
        password: '',
        role: 'USER',
        store_id: stores[0]?.id || 'store_main',
      })
      setCreateErrors({})
      setCreateTouched({})
      if (onShowToast) onShowToast(`User "${payload.full_name}" created successfully!`, 'success')
    } catch (err) {
      console.error('Error creating company user:', err)
      setCreateApiError(err.message || 'Failed to create user. Please verify user details.')
    } finally {
      setCreating(false)
    }
  }

  // Open Edit User Modal
  const openEditModal = (user) => {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name || user.name || '',
      role: (user.role || 'USER').toUpperCase(),
      store_id: user.store_id || '',
      is_active: user.is_active !== false,
      password: '',
    })
    setEditApiError('')
    setIsEditModalOpen(true)
  }

  // Handle Edit User Submit (PUT /api/tenant/users/{user_id})
  const handleUpdateUser = async (e) => {
    e?.preventDefault()
    if (!editingUser) return
    setEditApiError('')
    setUpdating(true)

    try {
      const payload = {
        full_name: editForm.full_name.trim(),
        role: editForm.role,
        store_id: editForm.store_id || null,
        is_active: editForm.is_active,
      }
      if (editForm.password && editForm.password.length >= 6) {
        payload.password = editForm.password
      }

      await api.updateTenantUser(editingUser.id, payload)

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...payload, name: payload.full_name }
            : u
        )
      )

      setIsEditModalOpen(false)
      if (onShowToast) onShowToast(`User "${payload.full_name}" updated successfully!`, 'success')
    } catch (err) {
      console.error('Error updating company user:', err)
      setEditApiError(err.message || 'Failed to update user.')
    } finally {
      setUpdating(false)
    }
  }

  // Handle User Deactivate (DELETE /api/tenant/users/{user_id})
  const handleToggleActive = async (user) => {
    if (!isAdmin) return
    const isCurrentlyActive = user.is_active !== false

    const confirmMsg = isCurrentlyActive
      ? `Are you sure you want to deactivate ${user.full_name || user.email}?`
      : `Reactivate account for ${user.full_name || user.email}?`

    if (!window.confirm(confirmMsg)) return

    try {
      if (isCurrentlyActive) {
        await api.deactivateTenantUser(user.id)
      } else {
        await api.updateTenantUser(user.id, { is_active: true })
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !isCurrentlyActive } : u
        )
      )

      if (onShowToast) {
        onShowToast(
          `User ${isCurrentlyActive ? 'deactivated' : 'reactivated'} successfully!`,
          'success'
        )
      }
    } catch (err) {
      console.error('Error toggling user status:', err)
      if (onShowToast) onShowToast(err.message || 'Status change failed', 'error')
    }
  }

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim()
    const nameMatch = (u.full_name || u.name || '').toLowerCase().includes(q)
    const emailMatch = (u.email || '').toLowerCase().includes(q)
    const matchesSearch = !q || nameMatch || emailMatch

    const uRole = (u.role || 'USER').toUpperCase()
    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' && (uRole.includes('ADMIN') || uRole === 'STORE_ADMIN')) ||
      (roleFilter === 'USER' && (uRole === 'USER' || uRole === 'STORE_STAFF' || uRole === 'STAFF'))

    const isActive = u.is_active !== false
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  // Telemetry counts
  const totalCount = users.length
  const activeCount = users.filter((u) => u.is_active !== false).length
  const adminCount = users.filter((u) => {
    const r = (u.role || '').toUpperCase()
    return r.includes('ADMIN')
  }).length
  const staffCount = totalCount - adminCount

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 space-y-4 w-full">
      {/* Header Row aligned with Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            User management
          </h1>
          <span className="hidden lg:inline text-xs font-medium text-slate-500">
            Tenant workspace · Manage company accounts, store staff, and admin permissions
          </span>
        </div>

        {/* Action Button: Create Company User */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh users"
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Create user</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              Admin only creation
            </span>
          )}
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">Total Users</p>
            <p className="text-lg font-black text-slate-900 leading-tight">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">Active Accounts</p>
            <p className="text-lg font-black text-emerald-600 leading-tight">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">Store Admins</p>
            <p className="text-lg font-black text-purple-700 leading-tight">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">Store Staff</p>
            <p className="text-lg font-black text-slate-700 leading-tight">{staffCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Role Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'ADMIN' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Admins
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('USER')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'USER' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Staff
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-white text-slate-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Main Table: Full Width with in-table scrolling */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 bg-slate-50">User</th>
                <th className="px-4 py-3.5 bg-slate-50">Role</th>
                <th className="px-4 py-3.5 bg-slate-50">Assigned Store</th>
                <th className="px-4 py-3.5 bg-slate-50">Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Created Date</th>
                {isAdmin && <th className="px-4 py-3.5 text-right bg-slate-50">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-xs font-semibold">Loading company users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-sm font-bold text-slate-700">No users found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing your search or filters.'
                        : 'Click "Create user" to add your first store team member.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const name = user.full_name || user.name || 'Unnamed'
                  const initial = name.charAt(0).toUpperCase() || 'U'
                  const roleStr = (user.role || 'USER').toUpperCase()
                  const isUserAdmin = roleStr.includes('ADMIN')
                  const isActive = user.is_active !== false

                  const storeObj = stores.find((s) => s.id === user.store_id)
                  const storeLabel = storeObj?.name || user.store_id || 'Main Store'

                  const createdDate = user.created_at
                    ? new Date(user.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recently'

                  const isCurrentUser =
                    currentUser?.email &&
                    user.email &&
                    currentUser.email.toLowerCase() === user.email.toLowerCase()

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* User Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 border ${
                              isUserAdmin
                                ? 'bg-purple-100 text-purple-700 border-purple-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-900 leading-tight truncate">
                                {name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-normal leading-tight truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="px-4 py-3.5">
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            Store Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            Store Staff
                          </span>
                        )}
                      </td>

                      {/* Store Column */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
                          <Store className="w-3 h-3 text-slate-500" />
                          {storeLabel}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-medium">
                        {createdDate}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              title="Edit user"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(user)}
                              title={isActive ? 'Deactivate user' : 'Reactivate user'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isActive
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {isActive ? (
                                <Trash2 className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== CREATE USER MODAL ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Create company user
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adds a team member to your tenant workspace via POST /api/tenant/users
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {createApiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createApiError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => handleCreateChange('full_name', e.target.value)}
                    onBlur={() => handleCreateBlur('full_name')}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-all ${
                      createTouched.full_name && createErrors.full_name
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
                {createTouched.full_name && createErrors.full_name && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{createErrors.full_name}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => handleCreateChange('email', e.target.value)}
                    onBlur={() => handleCreateBlur('email')}
                    placeholder="alex.morgan@company.com"
                    className={`w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-all ${
                      createTouched.email && createErrors.email
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
                {createTouched.email && createErrors.email && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{createErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => handleCreateChange('password', e.target.value)}
                    onBlur={() => handleCreateBlur('password')}
                    placeholder="Minimum 6 characters"
                    className={`w-full pl-9 pr-11 py-2.5 bg-white border rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-all ${
                      createTouched.password && createErrors.password
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/10'
                        : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {createTouched.password && createErrors.password && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{createErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Role and Store Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Role Pill Radio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    User Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm((prev) => ({ ...prev, role: 'USER' }))}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        createForm.role === 'USER'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm((prev) => ({ ...prev, role: 'STORE_ADMIN' }))}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        createForm.role === 'STORE_ADMIN'
                          ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Admin
                    </button>
                  </div>
                </div>

                {/* Assigned Store */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assign Store
                  </label>
                  <select
                    value={createForm.store_id}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, store_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                    <option value="">No Store (Tenant HQ)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating user...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create user</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT USER MODAL ===================== */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit company user
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Update profile, role, or store assignment for {editingUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editApiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editApiError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, role: 'USER' }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      editForm.role === 'USER'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Store Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, role: 'STORE_ADMIN' }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      editForm.role === 'STORE_ADMIN'
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Store Admin
                  </button>
                </div>
              </div>

              {/* Store & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assigned Store
                  </label>
                  <select
                    value={editForm.store_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, store_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="">No Store (HQ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, is_active: true }))}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editForm.is_active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, is_active: false }))}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !editForm.is_active
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Password Reset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reset Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="New password (optional)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
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
