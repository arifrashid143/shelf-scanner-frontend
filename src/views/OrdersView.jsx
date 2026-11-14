import { useState, useMemo } from 'react'
import { Loader2, MoreVertical, FileText, Copy, Eye, X } from 'lucide-react'

export default function OrdersView({
  purchaseOrders = [],
  onSelectOrder,
  isLoading = false,
}) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [actionModalOrder, setActionModalOrder] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filterTabs = ['All', 'Draft', 'Approved', 'Rejected']

  // Ensure newest purchase orders are filtered & sorted efficiently
  const sortedOrders = useMemo(() => {
    const filtered = purchaseOrders.filter((po) => {
      if (statusFilter === 'All') return true
      return po.status === statusFilter
    })

    return [...filtered].sort((a, b) => {
      const timeA = a.createdAt || (a.rawCreatedAt ? new Date(a.rawCreatedAt).getTime() : 0)
      const timeB = b.createdAt || (b.rawCreatedAt ? new Date(b.rawCreatedAt).getTime() : 0)
      if (timeB !== timeA) return timeB - timeA
      return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true })
    })
  }, [purchaseOrders, statusFilter])

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 w-full">
      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden space-y-3 flex-1 flex flex-col min-h-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none shrink-0">Orders</h1>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#5956c6] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Order Cards List */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2.5 pb-2">
          {isLoading ? (
            <div className="bg-white rounded-md border border-slate-200/90 p-8 text-center text-slate-400 text-xs shadow-2xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading purchase orders from server...</span>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="bg-white rounded-md border border-slate-200/90 p-8 text-center text-slate-400 text-xs shadow-2xs">
              No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} purchase orders found.
            </div>
          ) : (
            sortedOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="bg-white rounded-md border border-slate-200/90 p-3.5 shadow-2xs flex items-center justify-between cursor-pointer active:scale-98 transition-transform w-full"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{order.id}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.supplier} · {order.date}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">
                      ₹{order.total.toLocaleString()}
                    </p>
                    <span
                      className={`inline-flex items-center text-[11px] font-bold mt-1 px-2 py-0.5 rounded border ${
                        order.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                          : order.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActionModalOrder(order)
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    title={`Actions for order ${order.id}`}
                    aria-label={`Actions for order ${order.id}`}
                  >
                    <MoreVertical className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT (In-table scrolling, no page scroll) ===================== */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 space-y-2.5 w-full">
        {/* Fixed Header Row matching Sidebar logo height */}
        <div className="flex items-center justify-between shrink-0 h-10">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">Purchase orders</h1>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#5956c6] text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Full-Width Table Card with scroll inside the table itself */}
        <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden w-full flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm border-collapse min-w-[650px]">
              <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs">
                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5 bg-slate-50">Order & Supplier</th>
                  <th className="px-6 py-3.5 bg-slate-50">Date</th>
                  <th className="px-6 py-3.5 bg-slate-50">Total</th>
                  <th className="px-6 py-3.5 text-right bg-slate-50">Status</th>
                  <th className="px-5 py-3.5 text-right bg-slate-50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-xs">Loading purchase orders from server...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
                      No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} purchase orders found.
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {order.id}
                          </span>
                          <span className="text-xs text-slate-500 font-normal mt-0.5">
                            {order.supplier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium">
                        {order.date}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        ₹{order.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                            order.status === 'Draft'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : order.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionModalOrder(order)
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:bg-slate-200 transition-colors cursor-pointer"
                            title={`Actions for order ${order.id}`}
                            aria-label={`Actions for order ${order.id}`}
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
      </div>

      {/* ==================== PURCHASE ORDER ACTIONS MODAL (THREE DOTS MENU) ==================== */}
      {actionModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-md max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                  <FileText className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {actionModalOrder.id}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 truncate">
                    {actionModalOrder.supplier}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOrder(null)}
                className="w-7 h-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Meta Badges */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Total:</span>
                <span className="font-bold text-slate-900">
                  ₹{actionModalOrder.total.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    actionModalOrder.status === 'Draft'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                      : actionModalOrder.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-rose-50 text-rose-700 border-rose-200/80'
                  }`}
                >
                  {actionModalOrder.status}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {actionModalOrder.date}
                </span>
              </div>
            </div>

            {/* Options List */}
            <div className="p-3 space-y-1.5">
              {/* Option 1: View Order Details */}
              <button
                type="button"
                onClick={() => {
                  const targetOrder = actionModalOrder
                  setActionModalOrder(null)
                  onSelectOrder(targetOrder)
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    View Order Details
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Review line items, pricing, and approve/reject
                  </p>
                </div>
              </button>

              {/* Option 2: Copy Purchase Order ID */}
              <button
                type="button"
                onClick={() => {
                  if (actionModalOrder?.id) {
                    navigator.clipboard?.writeText(actionModalOrder.id)
                    showToast(`Order ID "${actionModalOrder.id}" copied!`, 'success')
                    setActionModalOrder(null)
                  }
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                    Copy Purchase Order ID
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalOrder.id}
                  </p>
                </div>
              </button>

              {/* Option 3: Copy Supplier Name */}
              {actionModalOrder?.supplier && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(actionModalOrder.supplier)
                    showToast(`Supplier "${actionModalOrder.supplier}" copied!`, 'success')
                    setActionModalOrder(null)
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 text-left transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-slate-800">
                      Copy Supplier Name
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      {actionModalOrder.supplier}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActionModalOrder(null)}
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
