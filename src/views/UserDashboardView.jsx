import { ScanLine, FilePlus, Boxes, ArrowRight, AlertCircle } from 'lucide-react'

export default function UserDashboardView({
  onNavigate,
  onSelectScan,
  onGenerateOrder,
  recentScans,
  inventory,
}) {
  const lowStockCount = inventory.filter((item) => item.status === 'Low').length

  return (
    <div className="space-y-6 w-full max-w-[1550px]">
      {/* User Welcome Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white mb-2">
              Staff Floor Station
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Floor Associate Dashboard
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Scan retail shelves, report empty gaps, view real-time stock levels, and draft replenishment purchase orders for store managers.
            </p>
          </div>

          <button
            onClick={() => onNavigate('new-scan')}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-3 rounded-2xl text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4 text-blue-600" />
            Scan a shelf now
          </button>
        </div>
      </div>

      {/* 3 Core User Feature Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Feature 1: Scan Shelves */}
        <div
          onClick={() => onNavigate('new-scan')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              1. Scan Shelves
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Take photos or upload images of store shelves. Computer Vision detects products and flags empty gaps.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
            <span>Open scanner</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Feature 2: Generate Purchase Orders */}
        <div
          onClick={onGenerateOrder}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FilePlus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              2. Generate Purchase Order
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generate draft purchase orders for products that need restocking. Sent to Admin for final approval.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Generate draft order</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Feature 3: View Inventory */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              3. View Inventory
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Check real-time stock levels, available quantities, targets, and scan history trends across all SKUs.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>View {inventory.length} items ({lowStockCount} low)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Role Limitation Notice Banner */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
        <p>
          <span className="font-bold text-slate-800">Role Notice:</span> You are signed in with the <span className="font-semibold text-blue-600">User</span> role. You can scan shelves, view stock, and create draft orders. Only <span className="font-semibold text-purple-600">Admin</span> accounts can update stock quantities or approve/reject purchase orders.
        </p>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recent store scans</h2>
          <button
            onClick={() => onNavigate('new-scan')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            New scan →
          </button>
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
    </div>
  )
}
