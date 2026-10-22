import React from 'react'

export default function DashboardView({
  onNavigate,
  onSelectOrder,
  onSelectScan,
  purchaseOrders,
  recentScans,
}) {
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'Draft')

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => onNavigate('new-scan')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition-colors"
        >
          New scan
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Scans today</p>
          <p className="text-3xl font-bold text-slate-900">12</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Low-stock items</p>
          <p className="text-3xl font-bold text-red-500">7</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Pending POs</p>
          <p className="text-3xl font-bold text-slate-900">{pendingOrders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500 mb-1">Gaps found this week</p>
          <p className="text-3xl font-bold text-slate-900">31</p>
        </div>
      </div>

      {/* Main Content: Recent scans table & Needs approval */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Recent scans (2 cols) */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent scans</h2>
          <table className="w-full text-left text-sm">
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
                      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${
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

        {/* Right: Needs approval (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">Needs approval</h2>
            <div className="space-y-4">
              {pendingOrders.slice(0, 2).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {order.id} · {order.supplier}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.items.length} items · ₹{order.total.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700">
                    Draft
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('orders')}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Review orders
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
