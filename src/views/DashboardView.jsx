
import logoImg from '../assets/logo.png'

export default function DashboardView({
  onNavigate,
  onSelectOrder,
  onSelectScan,
  purchaseOrders,
  recentScans,
}) {
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'Draft')

  return (
    <div className="space-y-6 w-full max-w-[1550px]">
      {/* ===================== MOBILE LAYOUT (Pages 1 & 13) ===================== */}
      <div className="md:hidden space-y-5">
        {/* Top Greeting Header (Page 13) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Logo"
              className="w-10 h-10 rounded-xl shadow-xs object-contain"
            />
            <div>
              <p className="text-xs text-slate-500 font-medium">Good morning</p>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Main Store</h1>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs">
            PK
          </div>
        </div>

        {/* Hero Banner Card (Page 13) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
          <h2 className="text-lg font-bold tracking-tight">Check a shelf in seconds</h2>
          <p className="text-blue-100 text-xs mt-1 mb-4 leading-relaxed">
            Take a photo and we'll count stock and draft your order.
          </p>
          <button
            onClick={() => onNavigate('new-scan')}
            className="w-full bg-white text-blue-700 font-bold py-3 px-4 rounded-xl text-sm shadow-xs hover:bg-blue-50 transition-colors text-center"
          >
            Scan a shelf
          </button>
        </div>

        {/* 3 Stat Cards in a row (Page 13) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <p className="text-[11px] font-medium text-slate-500 mb-0.5">Low stock</p>
            <p className="text-2xl font-extrabold text-red-500">7</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <p className="text-[11px] font-medium text-slate-500 mb-0.5">To approve</p>
            <p className="text-2xl font-extrabold text-slate-900">{pendingOrders.length}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <p className="text-[11px] font-medium text-slate-500 mb-0.5">Scans today</p>
            <p className="text-2xl font-extrabold text-slate-900">12</p>
          </div>
        </div>

        {/* Needs your attention (Page 13) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Needs your attention</h3>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600"
            >
              See all
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Order PO-1042 card */}
            <div
              onClick={() => pendingOrders[0] && onSelectOrder(pendingOrders[0])}
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 flex items-center justify-between cursor-pointer bg-slate-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  PO
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Order PO-1042</h4>
                  <p className="text-[11px] text-slate-500">Stationery Hub · ₹18,400</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                Review
              </span>
            </div>

            {/* Low stock alert */}
            <div
              onClick={() => onNavigate('inventory')}
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 flex items-center justify-between cursor-pointer bg-slate-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                  !
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Pen Box is low</h4>
                  <p className="text-[11px] text-slate-500">2 left · target 10</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-600 border border-rose-200/80">
                Low
              </span>
            </div>
          </div>
        </div>

        {/* Recent scans (Page 13 & Page 1) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Recent scans</h3>

          <div className="space-y-2.5 divide-y divide-slate-100">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => {
                  if (scan.status === 'Done') onSelectScan(scan)
                }}
                className={`pt-2.5 first:pt-0 flex items-center justify-between ${
                  scan.status === 'Done' ? 'cursor-pointer' : ''
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{scan.shelf}</h4>
                  <p className="text-[11px] text-slate-500">
                    {scan.when} {scan.gaps !== '-' && `· ${scan.gaps} gaps`}
                  </p>
                </div>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    scan.status === 'Done'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                  }`}
                >
                  {scan.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT (Page 7) ===================== */}
      <div className="hidden md:block space-y-6">
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

        {/* Content: 2 Columns */}
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
                {pendingOrders.map((order) => (
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
    </div>
  )
}
