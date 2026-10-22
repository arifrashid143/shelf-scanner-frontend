import { useState } from 'react'
import { Plus, Edit2, Check, X, ShieldCheck, Lock, AlertCircle } from 'lucide-react'

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

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header with Role indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
            {isAdmin ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Controls Enabled
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Read-Only View
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Update stock counts, targets, and register new product SKUs.'
              : 'Real-time stock quantities and availability from shelf scan sync.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add new product
          </button>
        )}
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Main Grid: Inventory Table (Left) + Stock History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inventory Table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-left text-sm min-w-[420px]">
              <thead>
                <tr className="text-xs text-slate-400 font-medium border-b border-slate-100">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Stock / Target</th>
                  <th className="pb-3 font-medium">Level</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                  {isAdmin && <th className="pb-3 font-medium text-right">Admin</th>}
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
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-4 font-semibold text-slate-900">
                        {item.name}
                        <p className="text-[11px] text-slate-400 font-normal">
                          ₹{item.price} / unit
                        </p>
                      </td>

                      <td className="py-4 text-slate-600">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              value={editCurrent}
                              onChange={(e) => setEditCurrent(e.target.value)}
                              className="w-14 px-2 py-1 text-xs border rounded font-bold"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              value={editTarget}
                              onChange={(e) => setEditTarget(e.target.value)}
                              className="w-14 px-2 py-1 text-xs border rounded font-bold"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {item.current} / {item.target}
                          </span>
                        )}
                      </td>

                      <td className="py-4 w-36 sm:w-44">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLow ? 'bg-red-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-4 text-right">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isLow ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isEditingThis ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleSaveEdit(item.id, e)}
                                className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingItem(null)
                                }}
                                className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => startEdit(item, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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

        {/* Right: Stock History Bar Chart (1 col on lg) */}
        {selectedProduct && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedProduct.name} · history
                  </h2>
                  <span className="text-xs text-slate-400">Last 7 scans telemetry</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Target: {selectedProduct.target}
                </span>
              </div>

              {/* 7 Vertical Bars */}
              <div className="h-44 pt-6 pb-2 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
                {selectedProduct.history.map((val, idx) => {
                  const heightPercent = Math.max(15, Math.round((val / selectedProduct.target) * 100))
                  const isLast = idx === selectedProduct.history.length - 1
                  const isLowVal = val <= 2

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end"
                    >
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-xs transition-all ${
                          isLast && isLowVal ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                      ></div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Unit Price: ₹{selectedProduct.price}</span>
              <span className="font-semibold text-slate-800">
                Latest: {selectedProduct.current} on shelf
              </span>
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
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
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
