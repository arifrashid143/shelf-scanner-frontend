import {
  Scan,
  TrendingDown,
  Clock,
  Search,
  Package,
  Plus,
  ArrowRight,
  Check,
  Loader2,
  FileText,
} from 'lucide-react'

export default function AdminDashboardView({
  user,
  onNavigate,
  onSelectOrder,
  onSelectScan,
  purchaseOrders = [],
  recentScans = [],
  inventory = [],
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const displayName = user?.full_name || user?.name || 'Platform Superadmin'

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const pendingOrders = purchaseOrders.filter(
    (po) => po.status === 'Draft' || po.status === 'DRAFT' || po.status === 'Pending'
  )
  const lowStockItems = inventory.filter(
    (item) => item.status === 'Low' || item.is_low_stock === true
  )

  const totalGaps = recentScans.reduce(
    (sum, s) => sum + (s.empty_gaps_count ?? s.gaps ?? 0),
    0
  )

  const visibleScans = recentScans
  const visibleOrders = pendingOrders

  return (
    <div className="flex flex-col min-h-full lg:h-full lg:max-h-full space-y-4 w-full max-w-[1550px] min-h-0">
      {/* Top Header Row matching Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="hidden md:block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none truncate">
            {greeting}, {displayName}
          </h1>
          <span className="hidden xl:inline text-xs font-medium text-slate-500 truncate">
            {formattedDate} · Here&apos;s your shelf overview.
          </span>
        </div>

        {/* Action Buttons: Inventory & New scan */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2 rounded-xl border border-slate-200/90 hover:bg-slate-50 active:scale-98 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 bg-white shadow-2xs cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-600" />
            Inventory
          </button>

          <button
            type="button"
            onClick={() => onNavigate('new-scan')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New scan
          </button>
        </div>
      </div>

      {/* 4 Stat KPI Cards matching mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Card 1: Scans today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Scans today</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {recentScans.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/90 text-blue-600 flex items-center justify-center shrink-0">
            <Scan className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Low stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Low stock</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {lowStockItems.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/90 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Pending approval */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Pending approval</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {pendingOrders.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/90 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 4: Gaps found */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Gaps found</p>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {totalGaps}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid: Recent scans & Needs approval */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Recent scans (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent scans</h2>
          </div>

          <div className="flex-1 min-h-0 pt-3 space-y-2.5 overflow-y-auto no-scrollbar">
            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No scans recorded yet.
              </div>
            ) : (
              visibleScans.map((scan) => {
                const isProcessing =
                  scan.status?.toLowerCase() === 'processing' ||
                  scan.status?.toLowerCase() === 'pending'

                return (
                  <div
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Scan className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {scan.shelf || scan.shelf_id || 'General Shelf'}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                          {scan.time || scan.date || 'Recently'} · {scan.empty_gaps_count ?? scan.gaps ?? 0} gaps
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2 sm:ml-3">
                      {isProcessing ? (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/80">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Needs approval (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Needs approval</h2>
          </div>

          <div className="flex-1 min-h-0 pt-3 space-y-2.5 overflow-y-auto no-scrollbar">
            {pendingOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders pending approval. All orders are up to date.
              </div>
            ) : (
              visibleOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 active:scale-[0.99] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{order.id}</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                        {order.supplier || order.supplier_name || 'Supplier'} · {order.items?.length || 1} items
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2 sm:ml-3">
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
