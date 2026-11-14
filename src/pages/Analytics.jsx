import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  TrendingDown,
  RotateCcw,
  Loader2,
  Sparkles,
  Search,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

export default function Analytics({ onShowToast, onNavigateToOrders }) {
  const [lowStockData, setLowStockData] = useState(null)
  const [gapData, setGapData] = useState(null)
  const [recommendationsData, setRecommendationsData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [lowStockRes, gapRes, recoRes] = await Promise.all([
        api.getLowStockAnalytics().catch(() => null),
        api.getGapAnalytics().catch(() => null),
        api.getInventoryRecommendations({ reorder_only: false }).catch(() => null),
      ])

      setLowStockData(lowStockRes)
      setGapData(gapRes)
      setRecommendationsData(recoRes)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      if (onShowToast) onShowToast('Failed to load analytics telemetry', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isSubscribed = true
    async function initData() {
      try {
        const [lowStockRes, gapRes, recoRes] = await Promise.all([
          api.getLowStockAnalytics().catch(() => null),
          api.getGapAnalytics().catch(() => null),
          api.getInventoryRecommendations({ reorder_only: false }).catch(() => null),
        ])
        if (!isSubscribed) return
        setLowStockData(lowStockRes)
        setGapData(gapRes)
        setRecommendationsData(recoRes)
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    initData()
    return () => {
      isSubscribed = false
    }
  }, [])

  const lowStockItems = lowStockData?.items || []
  const shelfHeatmaps = gapData?.shelf_heatmaps || []
  const recommendations = recommendationsData?.recommendations || []

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full space-y-2.5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            Analytics &amp; Vision Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shelf gap heatmaps, stock deficit telemetry, and AI reorder intelligence
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-md border border-slate-200/90 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto disabled:opacity-60"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Critical Out of Stock
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                lowStockData?.critical_out_of_stock_count ?? 0
              )}
            </span>
          </div>
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
        </div>

        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Low Stock Alerts
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                lowStockData?.total_low_stock_count ?? lowStockItems.length
              )}
            </span>
          </div>
          <TrendingDown className="w-5 h-5 text-amber-500 shrink-0" />
        </div>

        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Shelves Monitored
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                gapData?.total_shelves_monitored ?? shelfHeatmaps.length
              )}
            </span>
          </div>
          <Layers className="w-5 h-5 text-blue-500 shrink-0" />
        </div>

        <div className="bg-white p-3 rounded-md border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Shelf Gaps Recorded
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                gapData?.total_gaps_recorded ?? 0
              )}
            </span>
          </div>
          <Search className="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
      </div>

      {/* Main 2-Column Analytics Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch">
        {/* Left Column: Shelf Gap Heatmaps */}
        <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full min-h-0">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Shelf Gap Heatmap Telemetry</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Live AI Scan Audit
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 space-y-2">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Computing shelf gap heatmaps...</span>
              </div>
            ) : shelfHeatmaps.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No shelf gap heatmaps recorded</p>
                <p className="text-slate-400 mt-1">Run visual shelf scans to record live telemetry.</p>
              </div>
            ) : (
              shelfHeatmaps.map((shelf, idx) => {
                const gapCount = shelf.gap_count ?? shelf.gaps ?? 0
                const gapRate = shelf.gap_rate_percent ?? (gapCount > 0 ? Math.min(100, gapCount * 15) : 0)
                const isCritical = gapCount >= 3 || gapRate >= 40

                return (
                  <div
                    key={shelf.shelf_id || idx}
                    className="p-3 rounded-md border border-slate-100 hover:border-slate-200 bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs truncate block">
                          {shelf.shelf_name || shelf.shelf_id || `Shelf Section ${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {shelf.shelf_id || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            gapCount === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {gapCount === 0 ? 'Optimal (0 gaps)' : `${gapCount} empty gaps`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Heatmap */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            gapCount === 0
                              ? 'bg-emerald-500'
                              : isCritical
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(5, gapRate)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                        {gapRate}%
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: AI Reorder Recommendations & Low Stock Deficits */}
        <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full min-h-0">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">AI Auto-Reorder Recommendations</h2>
            </div>
            {onNavigateToOrders && (
              <button
                type="button"
                onClick={onNavigateToOrders}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View POs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 space-y-2">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span>Generating AI stock recommendations...</span>
              </div>
            ) : recommendations.length === 0 && lowStockItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="font-bold text-slate-700">All Shelves Healthy</p>
                <p className="text-slate-400 mt-1">
                  No products are currently under min threshold capacity.
                </p>
              </div>
            ) : (
              (recommendations.length > 0 ? recommendations : lowStockItems).map((item, idx) => {
                const name = item.product_name || item.name || `SKU-${item.product_id || idx}`
                const currentStock = item.current_stock ?? item.current ?? 0
                const targetCapacity = item.shelf_capacity ?? item.target ?? 10
                const recommendedQty =
                  item.recommended_reorder_qty ||
                  item.reorder_qty ||
                  Math.max(1, targetCapacity - currentStock)
                const isOutOfStock = currentStock === 0

                return (
                  <div
                    key={item.product_id || idx}
                    className="p-3 rounded-md border border-slate-100 hover:border-slate-200 bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 font-bold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs truncate block">
                          {name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Shelf: {currentStock} / {targetCapacity} units
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#5956c6]/10 text-[#5956c6] border border-[#5956c6]/20">
                        +Reorder {recommendedQty}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        {isOutOfStock ? 'Critical deficit' : 'Threshold deficit'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
