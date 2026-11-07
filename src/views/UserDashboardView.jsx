import {
  Plus,
  Scan,
  TrendingDown,
  Search,
  Check,
  Loader2,
  FilePlus,
  Package,
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
  const tenantName =
    user?.tenant_name ||
    user?.tenant?.name ||
    user?.store_name ||
    user?.company_name ||
    'Apex Retail'

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
    <div className="flex flex-col h-full w-full min-h-0 space-y-2.5">
      {/* Top Greeting Header Row + New scan button */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
          {greeting}, {displayName} ({tenantName})
        </h1>

        <button
          type="button"
          onClick={() => onNavigate('new-scan')}
          className="px-3.5 py-1.5 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-98 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New scan</span>
        </button>
      </div>

      {/* 3 Stat KPI Cards matching mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
        {/* Card 1: Total scans */}
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Total scans</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {totalScansCount || recentScans.length}
              </p>
            )}
          </div>
          <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100/90 text-blue-600 flex items-center justify-center shrink-0">
            <Scan className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Low stock */}
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Low stock</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {lowStockCount}
              </p>
            )}
          </div>
          <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-100/90 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Gaps found */}
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Gaps found</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {totalGaps}
              </p>
            )}
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid: Scan history & Quick actions */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch h-full">
        {/* Left Column: Scan history */}
        <div className="bg-white rounded-md border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col h-full min-h-0">
          <div className="pb-2 border-b border-slate-100 shrink-0">
            <h2 className="text-sm font-bold text-slate-900">Scan history</h2>
          </div>

          <div className="flex-1 min-h-0 pt-2 space-y-1.5 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading shelf scans...</span>
              </div>
            ) : visibleScans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                <span>No verified scans recorded yet.</span>
              </div>
            ) : (
              visibleScans.map((scan) => {
                return (
                  <div
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Scan className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {scan.shelf || scan.shelf_id || 'General Shelf'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                          {scan.time || scan.date || 'Recently'} · {scan.empty_gaps_count ?? scan.gaps ?? 0} gaps
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                        <Check className="w-3 h-3 text-[#059669] stroke-[2.5]" />
                        Verified
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Quick actions */}
        <div className="bg-white rounded-md border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col h-full min-h-0 justify-between">
          <div>
            <div className="pb-2 border-b border-slate-100 shrink-0">
              <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
            </div>

            <div className="pt-3 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Notice gaps or low stock on aisle shelves? Trigger an instant shelf scan or draft an AI restock purchase order for store manager approval.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('new-scan')}
                  className="p-3 rounded-md border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 transition-all text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center mb-2 shadow-2xs">
                    <Scan className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700">
                    Scan Shelf Now
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Capture photo to detect gaps
                  </p>
                </button>

                <button
                  type="button"
                  onClick={onGenerateOrder}
                  className="p-3 rounded-md border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition-all text-left group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-[#5956c6] text-white flex items-center justify-center mb-2 shadow-2xs">
                    <FilePlus className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-700">
                    Generate PO
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Order for {lowStockCount} low items
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
