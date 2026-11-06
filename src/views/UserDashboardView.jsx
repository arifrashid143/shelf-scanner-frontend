import {
  Scan,
  TrendingDown,
  Search,
  Check,
  Loader2,
  FilePlus,
  Package,
} from 'lucide-react'

export default function UserDashboardView({
  onNavigate,
  onSelectScan,
  onGenerateOrder,
  recentScans = [],
  inventory = [],
  totalScansCount = 0,
  isLoading = false,
}) {
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
      {/* 3 Stat KPI Cards matching mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
        {/* Card 1: TOTAL SCANS */}
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              TOTAL SCANS
            </p>
            <div className="w-8 h-8 rounded-md bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
              <Scan className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalScansCount || recentScans.length}
            </p>
          )}
        </div>

        {/* Card 2: LOW STOCK */}
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              LOW STOCK
            </p>
            <div className="w-8 h-8 rounded-md bg-[#fff1f2] text-[#f43f5e] flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {lowStockCount}
            </p>
          )}
        </div>

        {/* Card 3: GAPS FOUND */}
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              GAPS FOUND
            </p>
            <div className="w-8 h-8 rounded-md bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalGaps}
            </p>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Grid: SCAN HISTORY & QUICK RESTOCK - Covering fill vertical space */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch h-full">
        {/* Left Column: SCAN HISTORY */}
        <div className="bg-white rounded-md border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
              SCAN HISTORY
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Recent items</span>
          </div>

          <div className="flex-1 min-h-0 pt-2 space-y-1.5 overflow-y-auto no-scrollbar">
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
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-[#eff6ff] text-[#3b82f6] border border-blue-100/60 flex items-center justify-center shrink-0">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
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

        {/* Right Column: Quick Restock & Actions */}
        <div className="bg-white rounded-md border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col h-full min-h-0 justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                QUICK RESTOCK
              </h2>
            </div>

            <div className="pt-3 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Notice gaps or low stock on aisle shelves? You can trigger an instant shelf scan or draft an AI restock purchase order for store manager approval.
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
