import { useState } from 'react'
import { Lock, AlertCircle, Check, X } from 'lucide-react'

export default function OrderDetailView({
  order,
  isAdmin,
  onBack,
  onApprove,
  onReject,
}) {
  const [items, setItems] = useState(order.items)
  const [status, setStatus] = useState(order.status)
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleManualQtyChange = (id, newQty) => {
    if (!isAdmin || status !== 'Draft') return
    const val = parseInt(newQty, 10)
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: isNaN(val) ? 0 : val } : item
      )
    )
  }

  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.qty * (item.unitPrice || 600),
    0
  )

  const handleApproveClick = async () => {
    if (!isAdmin) {
      setActionError('Access Denied: Only Admins can approve purchase orders.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    try {
      await onApprove(order.id)
      setStatus('Approved')
    } catch (err) {
      setActionError(err.message || 'Failed to approve order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectClick = async () => {
    if (!isAdmin) {
      setActionError('Access Denied: Only Admins can reject purchase orders.')
      return
    }
    setActionError('')
    setIsSubmitting(true)
    try {
      await onReject(order.id)
      setStatus('Rejected')
    } catch (err) {
      setActionError(err.message || 'Failed to reject order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-[1550px]">
      {/* Header matching Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 mr-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            {order.id}
          </h1>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              status === 'Draft'
                ? 'bg-amber-100 text-amber-800'
                : status === 'Approved'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Created from scan · {order.scanSource || 'Aisle 3, Shelf B'}
        </p>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items Table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-left text-sm min-w-[360px]">
              <thead>
                <tr className="text-xs text-slate-400 font-medium border-b border-slate-100">
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium text-right">Order qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-4 text-slate-600">{item.stock}</td>
                    <td className="py-4 text-slate-600">{item.target}</td>
                    <td className="py-4 text-right">
                      {isAdmin && status === 'Draft' ? (
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                          className="w-16 px-3 py-1.5 text-center text-sm font-semibold border border-slate-300 rounded-lg focus:outline-blue-500"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{item.qty} units</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-8">
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Quantities are suggested by the AI based on shelf gap counts and sales velocity. Edit before approving.'
                : 'Generated from shelf gap counts. This order requires Store Admin review and approval before dispatch.'}
            </p>
          </div>
        </div>

        {/* Right: Summary Card (1 col on lg) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Summary</h2>
              {order.createdBy && (
                <span className="text-[10px] text-slate-400">
                  By: {order.createdBy}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Supplier</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{order.supplier}</p>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-slate-500">Items</span>
              <span className="font-semibold text-slate-900">{items.length}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="text-xl font-bold text-slate-900">
                ₹{Math.round(calculatedTotal).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            {status === 'Draft' ? (
              isAdmin ? (
                <>
                  <button
                    onClick={handleApproveClick}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors text-center shadow-xs flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve order
                  </button>
                  <button
                    onClick={handleRejectClick}
                    disabled={isSubmitting}
                    className="w-full text-slate-600 hover:text-rose-600 font-medium py-2 text-sm text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Approval Restricted
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Only Store Admins are authorized to accept or reject purchase orders. You can generate new orders, but approval remains admin-only.
                  </p>
                </div>
              )
            ) : (
              <div
                className={`py-3 px-4 rounded-xl text-center text-xs font-bold ${
                  status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                Order {status} {order.approvedBy ? `by ${order.approvedBy}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
