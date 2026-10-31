import { useState } from 'react'

export default function OrdersView({ purchaseOrders, onSelectOrder }) {
  const [statusFilter, setStatusFilter] = useState('All')

  const filterTabs = ['All', 'Draft', 'Approved', 'Rejected']

  const filteredOrders = purchaseOrders.filter((po) => {
    if (statusFilter === 'All') return true
    return po.status === statusFilter
  })

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 w-full">
      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden space-y-4 flex-1 flex flex-col min-h-0">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight shrink-0">Orders</h1>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Order Cards List */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-3 pb-2">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs shadow-xs">
              No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} purchase orders found.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between cursor-pointer active:scale-98 transition-transform w-full"
              >
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{order.id}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.supplier} · {order.date}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-slate-900 text-sm">
                    ₹{order.total.toLocaleString()}
                  </p>
                  <span
                    className={`inline-flex items-center text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full border ${
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
      <div className="hidden md:flex flex-col flex-1 min-h-0 space-y-4 w-full">
        {/* Fixed Header Row matching Sidebar logo height */}
        <div className="flex items-center justify-between shrink-0 h-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">Purchase orders</h1>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Full-Width Table Card with scroll inside the table itself */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full flex-1 min-h-0 flex flex-col">
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-slate-400 text-sm">
                      No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} purchase orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
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
