import React, { useState } from 'react'

export default function OrderDetailView({
  order,
  onBack,
  onUpdateStatus,
}) {
  const [items, setItems] = useState(order.items)
  const [status, setStatus] = useState(order.status)

  const handleQtyChange = (id, newQty) => {
    if (status !== 'Draft') return
    const val = parseInt(newQty, 10)
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: isNaN(val) ? 0 : val } : item
      )
    )
  }

  // Calculate live total
  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.qty * (item.unitPrice || 600),
    0
  )

  const handleApprove = () => {
    setStatus('Approved')
    onUpdateStatus(order.id, 'Approved', items, calculatedTotal)
  }

  const handleReject = () => {
    setStatus('Rejected')
    onUpdateStatus(order.id, 'Rejected', items, calculatedTotal)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 mr-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{order.id}</h1>
          <span
            className={`text-xs px-2.5 py-0.5 rounded font-medium ${
              status === 'Draft'
                ? 'bg-amber-50 text-amber-700'
                : status === 'Approved'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Created from scan · {order.scanSource || 'Aisle 3, Shelf B'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Items Table (2 cols) */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <table className="w-full text-left text-sm">
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
                      {status === 'Draft' ? (
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          className="w-16 px-3 py-1.5 text-center text-sm font-semibold border border-slate-300 rounded-lg focus:outline-blue-500"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{item.qty}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-8">
            <p className="text-xs text-slate-400">
              Quantities are suggested by the agent from stock and sales history. Edit before approving.
            </p>
          </div>
        </div>

        {/* Right: Summary Card (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Summary</h2>

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
              <>
                <button
                  onClick={handleApprove}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors text-center"
                >
                  Approve order
                </button>
                <button
                  onClick={handleReject}
                  className="w-full text-slate-600 hover:text-rose-600 font-medium py-2 text-sm text-center transition-colors"
                >
                  Reject
                </button>
              </>
            ) : (
              <div
                className={`py-2 px-3 rounded-lg text-center text-xs font-bold ${
                  status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                Order {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
