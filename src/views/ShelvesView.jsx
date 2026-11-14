import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Layers,
  Plus,
  Search,
  Store,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Loader2,
  X,
  Building,
  BarChart2,
} from 'lucide-react'

export default function ShelvesView({ isAdmin, onShowToast }) {
  const [shelves, setShelves] = useState([])
  const [stores, setStores] = useState([])
  const [hierarchy, setHierarchy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStoreId, setSelectedStoreId] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isAddShelfOpen, setIsAddShelfOpen] = useState(false)
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false)
  const [actionModalShelf, setActionModalShelf] = useState(null)
  const [editingShelf, setEditingShelf] = useState(null)
  const [shelfDetailModal, setShelfDetailModal] = useState(null)

  // Forms
  const [shelfForm, setShelfForm] = useState({
    name: '',
    code: '',
    store_id: '',
    aisle: '',
    section: '',
    tier_count: 4,
    max_capacity: 50,
  })
  const [storeForm, setStoreForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (text, type = 'info') => {
    if (onShowToast) onShowToast(text, type)
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load shelves, stores, and hierarchy
  const loadData = async () => {
    setLoading(true)
    try {
      const [shelvesRes, storesRes, hierarchyRes] = await Promise.all([
        api.getTenantShelves().catch(() => []),
        api.getTenantStores().catch(() => []),
        api.getTenantHierarchy().catch(() => null),
      ])

      const rawShelves = Array.isArray(shelvesRes)
        ? shelvesRes
        : shelvesRes?.items || shelvesRes?.shelves || []
      setShelves(rawShelves)

      const rawStores = Array.isArray(storesRes)
        ? storesRes
        : storesRes?.stores || storesRes?.items || []
      setStores(rawStores)

      if (hierarchyRes) setHierarchy(hierarchyRes)
    } catch (err) {
      console.error('Failed to load shelves data:', err)
      showToast(err.message || 'Failed to load shelves', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isSubscribed = true
    async function initData() {
      try {
        const [shelvesRes, storesRes, hierarchyRes] = await Promise.all([
          api.getTenantShelves().catch(() => []),
          api.getTenantStores().catch(() => []),
          api.getTenantHierarchy().catch(() => null),
        ])
        if (!isSubscribed) return

        const rawShelves = Array.isArray(shelvesRes)
          ? shelvesRes
          : shelvesRes?.items || shelvesRes?.shelves || []
        setShelves(rawShelves)

        const rawStores = Array.isArray(storesRes)
          ? storesRes
          : storesRes?.stores || storesRes?.items || []
        setStores(rawStores)

        if (hierarchyRes) setHierarchy(hierarchyRes)
      } catch (err) {
        console.error('Failed to load shelves data:', err)
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    initData()
    return () => {
      isSubscribed = false
    }
  }, [])

  // Create Shelf
  const handleSaveShelf = async (e) => {
    e.preventDefault()
    if (!shelfForm.name.trim()) {
      setFormError('Shelf name is required')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: shelfForm.name.trim(),
        code: shelfForm.code.trim() || undefined,
        store_id: shelfForm.store_id || (stores[0]?.id || 'store_main'),
        aisle: shelfForm.aisle.trim() || undefined,
        section: shelfForm.section.trim() || undefined,
        tier_count: parseInt(shelfForm.tier_count, 10) || 4,
        max_capacity: parseInt(shelfForm.max_capacity, 10) || 50,
      }

      if (editingShelf) {
        await api.updateShelf(editingShelf.id, payload)
        showToast(`Shelf "${payload.name}" updated successfully!`, 'success')
      } else {
        await api.createTenantShelf(payload)
        showToast(`Shelf "${payload.name}" created successfully!`, 'success')
      }

      setIsAddShelfOpen(false)
      setEditingShelf(null)
      setShelfForm({
        name: '',
        code: '',
        store_id: '',
        aisle: '',
        section: '',
        tier_count: 4,
        max_capacity: 50,
      })
      await loadData()
    } catch (err) {
      setFormError(err.message || 'Failed to save shelf')
    } finally {
      setSaving(false)
    }
  }

  // Create Store
  const handleSaveStore = async (e) => {
    e.preventDefault()
    if (!storeForm.name.trim()) {
      setFormError('Store name is required')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: storeForm.name.trim(),
        code: storeForm.code.trim() || undefined,
        address: storeForm.address.trim() || undefined,
        city: storeForm.city.trim() || undefined,
      }
      await api.createTenantStore(payload)
      showToast(`Store "${payload.name}" created successfully!`, 'success')
      setIsAddStoreOpen(false)
      setStoreForm({ name: '', code: '', address: '', city: '' })
      await loadData()
    } catch (err) {
      setFormError(err.message || 'Failed to create store')
    } finally {
      setSaving(false)
    }
  }

  // Deactivate Shelf
  const handleDeleteShelf = async (shelf) => {
    if (!window.confirm(`Are you sure you want to deactivate shelf "${shelf.name}"?`)) return
    try {
      await api.deleteShelf(shelf.id)
      showToast(`Shelf "${shelf.name}" deactivated!`, 'success')
      await loadData()
    } catch (err) {
      showToast(err.message || 'Failed to deactivate shelf', 'error')
    }
  }

  // Filtered shelves
  const filteredShelves = shelves.filter((shelf) => {
    const matchesStore =
      selectedStoreId === 'ALL' || String(shelf.store_id) === String(selectedStoreId)
    const matchesSearch =
      !searchQuery ||
      (shelf.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shelf.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shelf.aisle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shelf.section || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStore && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full space-y-2.5">
      {/* Top Header Row with Title, Store Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            Shelves &amp; Stores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical store layouts, aisles, shelf tiers and capacity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Store Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-md px-2.5 py-1 text-xs shadow-2xs">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stores ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Store Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setFormError('')
                setIsAddStoreOpen(true)
              }}
              className="px-3 py-1.5 rounded-md border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
            >
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Add Store</span>
            </button>
          )}

          {/* Add Shelf Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingShelf(null)
                setShelfForm({
                  name: '',
                  code: '',
                  store_id: selectedStoreId !== 'ALL' ? selectedStoreId : stores[0]?.id || '',
                  aisle: '',
                  section: '',
                  tier_count: 4,
                  max_capacity: 50,
                })
                setFormError('')
                setIsAddShelfOpen(true)
              }}
              className="px-3.5 py-1.5 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-98 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Shelf</span>
            </button>
          )}
        </div>
      </div>

      {/* Hierarchy KPI Summary Strip */}
      {hierarchy && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tenant
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                {hierarchy.tenant_name || 'Current Tenant'}
              </span>
            </div>
            <Building className="w-4 h-4 text-purple-500 shrink-0" />
          </div>

          <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Stores
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {stores.length}
              </span>
            </div>
            <Store className="w-4 h-4 text-blue-500 shrink-0" />
          </div>

          <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shelves Configured
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {shelves.length}
              </span>
            </div>
            <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>

          <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Capacity
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {shelves.reduce((acc, s) => acc + (s.max_capacity || 0), 0)} units
              </span>
            </div>
            <BarChart2 className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
        </div>
      )}

      {/* Main Shelves Table Card */}
      <div className="flex-1 min-h-0 bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search shelf by name, code, aisle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredShelves.length} of {shelves.length} shelves
          </span>
        </div>

        {/* Table Body with In-Table Scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 bg-slate-50">Shelf / Code</th>
                <th className="px-4 py-3.5 bg-slate-50">Assigned Store</th>
                <th className="px-4 py-3.5 bg-slate-50">Aisle &amp; Section</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Tiers</th>
                <th className="px-4 py-3.5 bg-slate-50 text-right">Capacity</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Status</th>
                <th className="px-5 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading store shelves...</span>
                  </td>
                </tr>
              ) : filteredShelves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700">No shelves found</p>
                    <p className="text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing your search query'
                        : 'Click "New Shelf" above to configure your store shelves'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredShelves.map((shelf) => {
                  const storeObj = stores.find((s) => String(s.id) === String(shelf.store_id))
                  const storeLabel = storeObj?.name || shelf.store_id || 'Main Store'
                  const isActive = shelf.is_active !== false

                  return (
                    <tr
                      key={shelf.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setShelfDetailModal(shelf)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {shelf.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {shelf.code || shelf.id}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                          <Store className="w-3 h-3 text-slate-500" />
                          {storeLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {shelf.aisle || shelf.section ? (
                          <span>
                            {shelf.aisle && `Aisle ${shelf.aisle}`}
                            {shelf.aisle && shelf.section && ' · '}
                            {shelf.section && `Sec ${shelf.section}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-800 text-xs">
                        {shelf.tier_count ?? 4}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-slate-900 text-xs">
                        {shelf.max_capacity ?? 50} units
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions Column with Three Dots */}
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionModalShelf(shelf)
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:bg-slate-200 transition-colors cursor-pointer"
                            title={`Actions for ${shelf.name}`}
                            aria-label={`Actions for ${shelf.name}`}
                          >
                            <MoreVertical className="w-4 h-4 stroke-[2]" />
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

      {/* ==================== SHELF ACTIONS MODAL (THREE DOTS) ==================== */}
      {actionModalShelf && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-md max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                  <Layers className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {actionModalShelf.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalShelf.code || actionModalShelf.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalShelf(null)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Capacity:</span>
                <span className="font-bold text-slate-900">
                  {actionModalShelf.max_capacity ?? 50} units
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Tiers:</span>
                <span className="font-bold text-slate-900">
                  {actionModalShelf.tier_count ?? 4}
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="p-3 space-y-1.5">
              {/* Option 1: View Shelf Details */}
              <button
                type="button"
                onClick={() => {
                  const s = actionModalShelf
                  setActionModalShelf(null)
                  setShelfDetailModal(s)
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    View Shelf Details
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Inspect physical configuration and planogram
                  </p>
                </div>
              </button>

              {/* Option 2: Edit Shelf */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const s = actionModalShelf
                    setActionModalShelf(null)
                    setEditingShelf(s)
                    setShelfForm({
                      name: s.name || '',
                      code: s.code || '',
                      store_id: s.store_id || '',
                      aisle: s.aisle || '',
                      section: s.section || '',
                      tier_count: s.tier_count || 4,
                      max_capacity: s.max_capacity || 50,
                    })
                    setIsAddShelfOpen(true)
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
                >
                  <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                      Edit Shelf
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Update aisle, section, tiers or capacity
                    </p>
                  </div>
                </button>
              )}

              {/* Option 3: Copy Shelf ID */}
              <button
                type="button"
                onClick={() => {
                  if (actionModalShelf?.id) {
                    navigator.clipboard?.writeText(actionModalShelf.id)
                    showToast(`Shelf ID "${actionModalShelf.id}" copied!`, 'success')
                    setActionModalShelf(null)
                  }
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                    Copy Shelf ID
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalShelf.id}
                  </p>
                </div>
              </button>

              {/* Option 4: Deactivate Shelf */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const s = actionModalShelf
                    setActionModalShelf(null)
                    handleDeleteShelf(s)
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-rose-50 text-left transition-colors cursor-pointer border border-transparent hover:border-rose-200 group"
                >
                  <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                      Deactivate Shelf
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Disable shelf from active vision scans
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActionModalShelf(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT SHELF MODAL ==================== */}
      {isAddShelfOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsAddShelfOpen(false)}
          ></div>
          <div className="relative bg-white rounded-md p-6 max-w-md w-full shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingShelf ? 'Edit Shelf' : 'Add Store Shelf'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure physical shelf parameters for AI vision detection.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-md">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveShelf} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shelf Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shelf Aisle 3 - Beverages"
                  value={shelfForm.name}
                  onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store
                  </label>
                  <select
                    value={shelfForm.store_id}
                    onChange={(e) => setShelfForm({ ...shelfForm, store_id: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600 bg-white"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shelf Code / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SH-A3-B"
                    value={shelfForm.code}
                    onChange={(e) => setShelfForm({ ...shelfForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aisle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3"
                    value={shelfForm.aisle}
                    onChange={(e) => setShelfForm({ ...shelfForm, aisle: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B"
                    value={shelfForm.section}
                    onChange={(e) => setShelfForm({ ...shelfForm, section: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tier Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={shelfForm.tier_count}
                    onChange={(e) => setShelfForm({ ...shelfForm, tier_count: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Shelf Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={shelfForm.max_capacity}
                    onChange={(e) => setShelfForm({ ...shelfForm, max_capacity: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddShelfOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-1.5 text-xs font-bold bg-[#5956c6] hover:bg-[#4d4ab5] text-white rounded-md shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingShelf ? 'Update Shelf' : 'Save Shelf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE STORE MODAL ==================== */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsAddStoreOpen(false)}
          ></div>
          <div className="relative bg-white rounded-md p-6 max-w-md w-full shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Add Company Store
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a new physical store location under your tenant workspace.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-md">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStore} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Retail - North Branch"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. STORE-002"
                  value={storeForm.code}
                  onChange={(e) => setStoreForm({ ...storeForm, code: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 4, Main Market"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStoreOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-1.5 text-xs font-bold bg-[#5956c6] hover:bg-[#4d4ab5] text-white rounded-md shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SHELF DETAILS MODAL ==================== */}
      {shelfDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-md max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{shelfDetailModal.name}</h3>
                  <p className="text-[11px] font-mono text-slate-400">ID: {shelfDetailModal.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShelfDetailModal(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Shelf Code</span>
                  <p className="font-bold text-slate-800 mt-0.5">{shelfDetailModal.code || 'None'}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Store</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {stores.find((s) => String(s.id) === String(shelfDetailModal.store_id))?.name ||
                      shelfDetailModal.store_id ||
                      'Main'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Aisle / Section</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    Aisle {shelfDetailModal.aisle || '—'}, Sec {shelfDetailModal.section || '—'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tiers & Capacity</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {shelfDetailModal.tier_count ?? 4} tiers ({shelfDetailModal.max_capacity ?? 50} units max)
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShelfDetailModal(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local Toast Alert */}
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
    </div>
  )
}
