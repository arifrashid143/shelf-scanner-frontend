import { useState } from 'react'
import {
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  Package,
  TrendingDown,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

export default function InventoryView({
  inventory,
  isAdmin,
  onUpdateProduct,
  onAddProduct,
}) {
  const [selectedProduct, setSelectedProduct] = useState(inventory[0] || null)
  const [editingItem, setEditingItem] = useState(null)
  const [editCurrent, setEditCurrent] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdCurrent, setNewProdCurrent] = useState('')
  const [newProdTarget, setNewProdTarget] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [saveError, setSaveError] = useState('')

  const startEdit = (item, e) => {
    e.stopPropagation()
    if (!isAdmin) return
    setEditingItem(item.id)
    setEditCurrent(item.current.toString())
    setEditTarget(item.target.toString())
    setSaveError('')
  }

  const handleSaveEdit = async (id, e) => {
    e?.stopPropagation()
    if (!isAdmin) return
    try {
      await onUpdateProduct({
        id,
        current: parseInt(editCurrent, 10),
        target: parseInt(editTarget, 10),
      })
      setEditingItem(null)
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Failed to update inventory')
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!newProdName || !newProdTarget) return

    try {
      await onAddProduct({
        name: newProdName,
        current: parseInt(newProdCurrent || 0, 10),
        target: parseInt(newProdTarget, 10),
        price: parseFloat(newProdPrice || 400),
      })
      setIsAddModalOpen(false)
      setNewProdName('')
      setNewProdCurrent('')
      setNewProdTarget('')
      setNewProdPrice('')
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Failed to add product')
    }
  }

  // Calculate telemetry values for selected product chart
  const historyData = selectedProduct?.history || []
  const maxVal = Math.max(selectedProduct?.target || 10, ...historyData, 1)
  const targetPercent = Math.min(100, Math.round(((selectedProduct?.target || 10) / maxVal) * 100))
  const capacityPercent = selectedProduct?.target
    ? Math.min(100, Math.round((selectedProduct.current / selectedProduct.target) * 100))
    : 0
  const isSelectedLow =
    selectedProduct?.status === 'Low' || capacityPercent < 35

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 space-y-4 w-full">
      {/* Header matching exact Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            Inventory
          </h1>
          <span className="hidden lg:inline text-xs font-medium text-slate-500">
            Real-time stock counts, shelf capacity targets, and scan sync telemetry.
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add new product
          </button>
        )}
      </div>

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Main Grid: Inventory Table (Left) + Upgraded Product Information Chart (Right) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-stretch w-full">
        {/* Left Column: Full-Width Inventory Table with in-table scrolling */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm border-collapse min-w-[540px]">
              <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs">
                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 bg-slate-50">Product</th>
                  <th className="px-4 py-3.5 bg-slate-50">Stock / Target</th>
                  <th className="px-4 py-3.5 bg-slate-50">Level</th>
                  <th className="px-4 py-3.5 text-right bg-slate-50">Status</th>
                  {isAdmin && <th className="px-4 py-3.5 text-right bg-slate-50">Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const percentage = Math.min(100, Math.round((item.current / item.target) * 100))
                  const isLow = item.status === 'Low' || percentage < 35
                  const isSelected = selectedProduct?.id === item.id
                  const isEditingThis = editingItem === item.id

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span
                            className={`font-bold transition-colors ${
                              isSelected
                                ? 'text-blue-700'
                                : 'text-slate-900 group-hover:text-blue-600'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-400 font-normal mt-0.5">
                            ₹{item.price} / unit
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {isEditingThis ? (
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              value={editCurrent}
                              onChange={(e) => setEditCurrent(e.target.value)}
                              className="w-14 px-2 py-1 text-xs border rounded-lg font-bold border-blue-400 focus:outline-blue-600"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              value={editTarget}
                              onChange={(e) => setEditTarget(e.target.value)}
                              className="w-14 px-2 py-1 text-xs border rounded-lg font-bold border-blue-400 focus:outline-blue-600"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900">
                            {item.current}{' '}
                            <span className="text-slate-400 font-normal">/ {item.target}</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 w-36 sm:w-44">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow ? 'bg-rose-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 w-8 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isEditingThis ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleSaveEdit(item.id, e)}
                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingItem(null)
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => startEdit(item, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit stock quantities (Admin)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Upgraded Product Information Chart & Telemetry Card */}
        {selectedProduct && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5 w-full h-full min-h-0 overflow-y-auto no-scrollbar">
            {/* Header: Product Identity & Status Badge */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                    ID: {selectedProduct.id.toUpperCase()} · Shelf Telemetry
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 border ${
                  isSelectedLow
                    ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelectedLow ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                {selectedProduct.status}
              </span>
            </div>

            {/* Quick Metrics KPI Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current On Shelf
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {selectedProduct.current}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    / {selectedProduct.target} units
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 mt-1 block truncate">
                  ₹{(selectedProduct.current * selectedProduct.price).toLocaleString()} total stock value
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Capacity Target
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {capacityPercent}%
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 block truncate ${
                    isSelectedLow ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isSelectedLow
                    ? `Deficit: ${selectedProduct.target - selectedProduct.current} units needed`
                    : 'Capacity target reached'}
                </span>
              </div>
            </div>

            {/* Chart Area with Threshold Benchmark & Bar Columns */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Scan Telemetry History</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Target: {selectedProduct.target} units
                </span>
              </div>

              {/* Chart Visual Container */}
              <div className="relative h-44 sm:h-48 pt-6 pb-2 px-2 bg-slate-50/50 rounded-xl border border-slate-200/60 flex flex-col justify-end">
                {/* Dashed Target Line Across the Chart */}
                <div
                  className="absolute left-2 right-2 border-b border-dashed border-slate-300 pointer-events-none flex items-center justify-end z-0"
                  style={{ bottom: `${targetPercent}%` }}
                >
                  <span className="text-[10px] font-bold text-slate-400 bg-white/95 px-1.5 py-0.5 rounded shadow-2xs -translate-y-1/2 border border-slate-200/80">
                    Target {selectedProduct.target}
                  </span>
                </div>

                {/* 7 Vertical Bar Columns */}
                <div className="relative z-10 flex items-end justify-between gap-2 sm:gap-3 h-full w-full">
                  {historyData.map((val, idx) => {
                    const heightPercent = Math.max(12, Math.min(100, Math.round((val / maxVal) * 100)))
                    const isLast = idx === historyData.length - 1
                    const isLowVal = val <= Math.max(2, Math.round((selectedProduct.target || 10) * 0.35))

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        title={`Scan ${idx + 1}: ${val} units on shelf`}
                      >
                        {/* Value Label Above Bar */}
                        <span
                          className={`text-[11px] font-bold mb-1.5 transition-all ${
                            isLast
                              ? 'text-slate-900 scale-105'
                              : 'text-slate-500 group-hover:text-blue-600 group-hover:font-extrabold'
                          }`}
                        >
                          {val}
                        </span>

                        {/* Bar Pillar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[32px] sm:max-w-[36px] rounded-t-lg transition-all duration-300 shadow-2xs ${
                            isLast
                              ? isLowVal
                                ? 'bg-gradient-to-t from-rose-600 to-rose-400 ring-2 ring-rose-200'
                                : 'bg-gradient-to-t from-emerald-600 to-emerald-400 ring-2 ring-emerald-200'
                              : 'bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400'
                          }`}
                        ></div>

                        {/* X-Axis Scan Label Below Bar */}
                        <span
                          className={`text-[10px] font-semibold mt-2 transition-colors ${
                            isLast
                              ? 'text-blue-700 font-bold'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        >
                          {isLast ? 'Latest' : `S${idx + 1}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer Metadata */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-400">Unit Price:</span>
                <span className="font-bold text-slate-800">₹{selectedProduct.price}</span>
              </div>

              <div>
                {isSelectedLow ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/70">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Restock advised
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Stock healthy
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl z-10 border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-1">Add Product to Inventory</h3>
            <p className="text-xs text-slate-500 mb-5">
              Register a new SKU with stock capacity and price.
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marker Pen 12pk"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newProdCurrent}
                    onChange={(e) => setNewProdCurrent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Shelf Target *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={newProdTarget}
                    onChange={(e) => setNewProdTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="450"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-blue-600 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
