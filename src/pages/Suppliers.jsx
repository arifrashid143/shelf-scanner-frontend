import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Truck,
  Plus,
  Search,
  Mail,
  Phone,
  Clock,
  DollarSign,
  MoreVertical,
  Copy,
  Loader2,
  X,
  FileText,
} from 'lucide-react'

export default function Suppliers({ isAdmin, onShowToast }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [actionModalSupplier, setActionModalSupplier] = useState(null)
  const [supplierDetailModal, setSupplierDetailModal] = useState(null)

  // Form State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    code: '',
    email: '',
    contact_name: '',
    phone: '',
    lead_time_days: 3,
    min_order_value: 500,
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (text, type = 'info') => {
    if (onShowToast) onShowToast(text, type)
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load suppliers
  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const res = await api.getSuppliers().catch(() => [])
      const rawList = Array.isArray(res) ? res : res?.suppliers || res?.items || []
      setSuppliers(rawList)
    } catch (err) {
      console.error('Failed to load suppliers:', err)
      showToast(err.message || 'Failed to load suppliers', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isSubscribed = true
    async function initData() {
      try {
        const res = await api.getSuppliers().catch(() => [])
        if (!isSubscribed) return
        const rawList = Array.isArray(res) ? res : res?.suppliers || res?.items || []
        setSuppliers(rawList)
      } catch (err) {
        console.error('Failed to load suppliers:', err)
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    initData()
    return () => {
      isSubscribed = false
    }
  }, [])

  // Create Supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault()
    if (!supplierForm.name.trim() || !supplierForm.code.trim() || !supplierForm.email.trim()) {
      setFormError('Name, Code, and Email are required')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: supplierForm.name.trim(),
        code: supplierForm.code.trim().toUpperCase(),
        email: supplierForm.email.trim(),
        contact_name: supplierForm.contact_name.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
        lead_time_days: parseInt(supplierForm.lead_time_days, 10) || 3,
        min_order_value: parseFloat(supplierForm.min_order_value) || 0,
      }

      await api.createSupplier(payload)
      showToast(`Supplier "${payload.name}" registered successfully!`, 'success')
      setIsAddModalOpen(false)
      setSupplierForm({
        name: '',
        code: '',
        email: '',
        contact_name: '',
        phone: '',
        lead_time_days: 3,
        min_order_value: 500,
      })
      await loadSuppliers()
    } catch (err) {
      setFormError(err.message || 'Failed to register supplier')
    } finally {
      setSaving(false)
    }
  }

  // Filtered list
  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.contact_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full space-y-2.5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            Suppliers &amp; Catalogs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vendor contacts, auto-reorder lead times and minimum purchase values
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setFormError('')
              setIsAddModalOpen(true)
            }}
            className="px-3.5 py-1.5 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-98 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Register Supplier</span>
          </button>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Suppliers
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              {suppliers.length}
            </span>
          </div>
          <Truck className="w-4 h-4 text-blue-500 shrink-0" />
        </div>

        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Lead Time
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              {suppliers.length > 0
                ? Math.round(
                    suppliers.reduce((acc, s) => acc + (s.lead_time_days || 3), 0) /
                      suppliers.length
                  )
                : 3}{' '}
              days
            </span>
          </div>
          <Clock className="w-4 h-4 text-purple-500 shrink-0" />
        </div>

        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Min Order
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹
              {suppliers.length > 0
                ? Math.round(
                    suppliers.reduce((acc, s) => acc + (s.min_order_value || 0), 0) /
                      suppliers.length
                  ).toLocaleString()
                : '0'}
            </span>
          </div>
          <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>

        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vendor Catalogs
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900">Active</span>
          </div>
          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="flex-1 min-h-0 bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search supplier by name, code, contact..."
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
            Showing {filteredSuppliers.length} of {suppliers.length} vendors
          </span>
        </div>

        {/* Table Body with In-Table Scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 bg-slate-50">Supplier &amp; Code</th>
                <th className="px-4 py-3.5 bg-slate-50">Contact Person</th>
                <th className="px-4 py-3.5 bg-slate-50">Email &amp; Phone</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Lead Time</th>
                <th className="px-4 py-3.5 bg-slate-50 text-right">Min Order Value</th>
                <th className="px-5 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading registered vendors...</span>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400 text-xs">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700">No suppliers found</p>
                    <p className="text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try clearing your search query'
                        : 'Click "Register Supplier" above to add your first vendor'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id || supplier.code}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSupplierDetailModal(supplier)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {supplier.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {supplier.code || supplier.id}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                      {supplier.contact_name || (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{supplier.email || '—'}</span>
                        </div>
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                        <Clock className="w-3 h-3" />
                        {supplier.lead_time_days ?? 3} days
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-slate-900 text-xs">
                      ₹{(supplier.min_order_value || 0).toLocaleString()}
                    </td>

                    {/* Actions Column with Three Dots */}
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActionModalSupplier(supplier)
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:bg-slate-200 transition-colors cursor-pointer"
                          title={`Actions for ${supplier.name}`}
                          aria-label={`Actions for ${supplier.name}`}
                        >
                          <MoreVertical className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== SUPPLIER ACTIONS MODAL (THREE DOTS) ==================== */}
      {actionModalSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-md max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                  <Truck className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {actionModalSupplier.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    Code: {actionModalSupplier.code || actionModalSupplier.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalSupplier(null)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Lead Time:</span>
                <span className="font-bold text-slate-900">
                  {actionModalSupplier.lead_time_days ?? 3} days
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Min Order:</span>
                <span className="font-bold text-slate-900">
                  ₹{(actionModalSupplier.min_order_value || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="p-3 space-y-1.5">
              {/* Option 1: View Details */}
              <button
                type="button"
                onClick={() => {
                  const s = actionModalSupplier
                  setActionModalSupplier(null)
                  setSupplierDetailModal(s)
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    View Supplier Details
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Inspect contract terms, catalog info and phone
                  </p>
                </div>
              </button>

              {/* Option 2: Copy Email */}
              {actionModalSupplier.email && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(actionModalSupplier.email)
                    showToast(`Supplier email copied!`, 'success')
                    setActionModalSupplier(null)
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                      Copy Supplier Email
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {actionModalSupplier.email}
                    </p>
                  </div>
                </button>
              )}

              {/* Option 3: Copy Code / ID */}
              <button
                type="button"
                onClick={() => {
                  const codeToCopy = actionModalSupplier.code || actionModalSupplier.id
                  navigator.clipboard?.writeText(codeToCopy)
                  showToast(`Supplier Code "${codeToCopy}" copied!`, 'success')
                  setActionModalSupplier(null)
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                    Copy Supplier Code
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalSupplier.code || actionModalSupplier.id}
                  </p>
                </div>
              </button>

              {/* Option 4: Copy Phone */}
              {actionModalSupplier.phone && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(actionModalSupplier.phone)
                    showToast(`Phone number copied!`, 'success')
                    setActionModalSupplier(null)
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                      Copy Contact Phone
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {actionModalSupplier.phone}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActionModalSupplier(null)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REGISTER SUPPLIER MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-md p-6 max-w-md w-full shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">Register Supplier</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a distributor or manufacturer for automated purchase order fulfillment.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-md">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Snack & Confectionery Distributors"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUP-SNK"
                    value={supplierForm.code}
                    onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium uppercase focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. orders@supplier.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={supplierForm.contact_name}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="3"
                    value={supplierForm.lead_time_days}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, lead_time_days: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={supplierForm.min_order_value}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, min_order_value: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-1.5 text-xs font-bold bg-[#5956c6] hover:bg-[#4d4ab5] text-white rounded-md shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SUPPLIER DETAIL MODAL ==================== */}
      {supplierDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-md max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{supplierDetailModal.name}</h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Code: {supplierDetailModal.code || supplierDetailModal.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSupplierDetailModal(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Name</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {supplierDetailModal.contact_name || 'Direct Sales'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {supplierDetailModal.phone || 'None recorded'}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lead Time</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {supplierDetailModal.lead_time_days ?? 3} business days
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Min Order</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    ₹{(supplierDetailModal.min_order_value || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Order Email</span>
                <p className="font-mono text-slate-800 mt-0.5 truncate">{supplierDetailModal.email}</p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSupplierDetailModal(null)}
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
