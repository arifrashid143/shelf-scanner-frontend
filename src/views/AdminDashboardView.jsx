import { ShieldCheck, Plus, ArrowRight, Boxes } from 'lucide-react'

export default function AdminDashboardView({
  onNavigate,
  onSelectOrder,
  onSelectScan,
  purchaseOrders,
  recentScans,
  inventory,
}) {
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'Draft')
  const lowStockItems = inventory.filter((item) => item.status === 'Low')

  return (
    <div className="space-y-6 w-full max-w-[1550px]">
      {/* Top Header Row with Admin Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Store Manager
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Full administrative overview, inventory control, and purchase order approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('inventory')}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            <Boxes className="w-4 h-4 text-slate-500" />
            Manage Inventory
          </button>
          <button
            onClick={() => onNavigate('new-scan')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New scan
          </button>
        </div>
      </div>

      {/* 4 Executive Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Scans today</p>
          <p className="text-3xl font-black text-slate-900">12</p>
          <p className="text-[11px] text-slate-400 mt-1">AI detections</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Low-stock items</p>
          <p className="text-3xl font-black text-red-500">{lowStockItems.length}</p>
          <p className="text-[11px] text-red-400 mt-1">Requires reorder</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Pending Approval</p>
          <p className="text-3xl font-black text-amber-600">{pendingOrders.length}</p>
          <p className="text-[11px] text-amber-500 mt-1">Draft POs waiting</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Gaps found</p>
          <p className="text-3xl font-black text-slate-900">31</p>
          <p className="text-[11px] text-slate-400 mt-1">This week across aisles</p>
        </div>
      </div>

      {/* Main Admin Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent scans table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent shelf scans</h2>
              <span className="text-xs text-slate-400">Live AI telemetry</span>
            </div>

            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
              <table className="w-full text-left text-sm min-w-[400px]">
                <thead>
                  <tr className="text-xs text-slate-400 font-medium border-b border-slate-100">
                    <th className="pb-3 font-medium">Shelf</th>
                    <th className="pb-3 font-medium">When</th>
                    <th className="pb-3 font-medium">Gaps</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentScans.map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => {
                        if (scan.status === 'Done') onSelectScan(scan)
                      }}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        scan.status === 'Done' ? 'cursor-pointer' : ''
                      }`}
                    >
                      <td className="py-4 font-semibold text-slate-900">{scan.shelf}</td>
                      <td className="py-4 text-slate-500">{scan.when}</td>
                      <td className="py-4 text-slate-600">{scan.gaps}</td>
                      <td className="py-4 text-right">
                        <span
                          className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            scan.status === 'Done'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Scans automatically detect missing SKUs and calculate reorder quantities.
            </span>
            <button
              onClick={() => onNavigate('new-scan')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Scan new shelf <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Needs Approval Queue (1 col on lg) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Needs Approval</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                {pendingOrders.length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No purchase orders currently pending approval.
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{order.id}</span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Draft
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{order.supplier}</span>
                      <span className="font-bold text-slate-900">
                        ₹{order.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>{order.items.length} line items</span>
                      <span className="text-purple-600 font-semibold hover:underline">
                        Review order →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('orders')}
              className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Manage all purchase orders
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
