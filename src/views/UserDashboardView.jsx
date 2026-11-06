import {
  Scan,
  TrendingDown,
  Search,
  Package,
  Plus,
  ArrowRight,
  Check,
  Loader2,
  FilePlus,
  Boxes,
} from 'lucide-react'

export default function UserDashboardView({
  user,
  onNavigate,
  onSelectScan,
  onGenerateOrder,
  recentScans = [],
  inventory = [],
  totalScansCount = 0,
  isLoading = false,
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const displayName = user?.full_name || user?.name || 'Store Associate'

  const lowStockCount = inventory.filter(
    (item) => item.status === 'Low' || item.is_low_stock === true
  ).length

  // Only show scans after they are successfully verified
  const visibleScans = recentScans.filter((scan) => {
    const st = (scan.status || '').toLowerCase()
    return st !== 'processing' && st !== 'pending'
  })

  const totalGaps = visibleScans.reduce(
    (sum, s) => sum + (s.empty_gaps_count ?? s.gaps ?? 0),
    0
  )

  return (
    <div className="flex flex-col min-h-full lg:h-full lg:max-h-full space-y-4 w-full max-w-[1550px] min-h-0">
      {/* Top Header Row matching Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="hidden md:block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none truncate">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Action Button: New scan */}
        <div className="flex items-center gap-3 shrink-0">
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

      {/* 3 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Total scans</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {totalScansCount || recentScans.length}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/90 text-blue-600 flex items-center justify-center shrink-0">
            <Scan className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Low stock</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {lowStockCount}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/90 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Gaps found</p>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
            ) : (
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {totalGaps}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Scan history */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Scan history</h2>
          </div>

          <div className="flex-1 min-h-0 pt-3 space-y-2.5 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading shelf scans...</span>
              </div>
            ) : visibleScans.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Package className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <span>No verified scans recorded yet.</span>
              </div>
            ) : (
              visibleScans.map((scan) => {
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
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        Verified
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Staff Actions & Fast Reorder */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Quick Restock Actions</h2>
          </div>

          <div className="flex-1 min-h-0 pt-3 space-y-2.5 overflow-y-auto no-scrollbar">
            <div
              onClick={onGenerateOrder}
              className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <FilePlus className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">Generate Restock Order</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                    Draft order for low stock items
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </div>

            <div
              onClick={() => onNavigate('inventory')}
              className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Boxes className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">Review Inventory</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                    View real-time shelf stock levels
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
