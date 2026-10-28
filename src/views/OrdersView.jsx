import { useState } from 'react'

export default function OrdersView({ purchaseOrders, onSelectOrder }) {
  const [statusFilter, setStatusFilter] = useState('All')

  const filterTabs = ['All', 'Draft', 'Approved', 'Rejected']

  const filteredOrders = purchaseOrders.filter((po) => {
    if (statusFilter === 'All') return true
    return po.status === statusFilter
  })

  return (
    <div className="space-y-6 w-full max-w-[1550px]">
      {/* ===================== MOBILE LAYOUT (Pages 5 & 17) ===================== */}
      <div className="md:hidden space-y-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h1>

        {/* Filter Tabs (Page 17) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Order Cards List (Page 17) */}
        <div className="space-y-3 max-h-[calc(100vh-230px)] overflow-y-auto pr-1 scrollbar-thin">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
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
                  className={`inline-block text-[11px] font-bold mt-0.5 ${
                    order.status === 'Draft'
                      ? 'text-amber-600'
                      : order.status === 'Approved'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT (Page 11) ===================== */}
      <div className="hidden md:block space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase orders</h1>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)] scrollbar-thin -mx-6 px-6">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="sticky top-0 bg-white z-10 shadow-2xs">
                <tr className="text-xs text-slate-400 font-medium border-b border-slate-100 bg-white">
                  <th className="py-3 font-medium bg-white">Order</th>
                  <th className="py-3 font-medium bg-white">Date</th>
                  <th className="py-3 font-medium bg-white">Total</th>
                  <th className="py-3 font-medium text-right bg-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-4 font-semibold text-slate-900">
                      {order.id} · {order.supplier}
                    </td>
                    <td className="py-4 text-slate-500">{order.date}</td>
                    <td className="py-4 font-medium text-slate-900">
                      ₹{order.total.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`inline-block text-xs px-2.5 py-0.5 rounded font-medium ${
                          order.status === 'Draft'
                            ? 'bg-amber-50 text-amber-700'
                            : order.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
