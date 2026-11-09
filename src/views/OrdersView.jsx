import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function OrdersView({
  purchaseOrders = [],
  onSelectOrder,
  isLoading = false,
}) {
  const [statusFilter, setStatusFilter] = useState('All')

  const filterTabs = ['All', 'Draft', 'Approved', 'Rejected']

  const filteredOrders = purchaseOrders.filter((po) => {
    if (statusFilter === 'All') return true
    return po.status === statusFilter
  })

  // Ensure newest purchase orders are always at the top of the table
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = a.createdAt || (a.rawCreatedAt ? new Date(a.rawCreatedAt).getTime() : 0)
    const timeB = b.createdAt || (b.rawCreatedAt ? new Date(b.rawCreatedAt).getTime() : 0)
    if (timeB !== timeA) return timeB - timeA
    return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true })
  })

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-slate-400 text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-xs">Loading purchase orders from server...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-slate-400 text-sm">
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
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
