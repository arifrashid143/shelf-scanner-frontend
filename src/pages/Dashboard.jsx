import { useMemo, useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Plus,
  Scan as ScanIcon,
  TrendingDown,
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  ArrowRight,
  Package,
  Layers,
  BarChart3,
} from 'lucide-react'

function formatShelfName(raw) {
  if (!raw) return 'Shelf Section'
  const cleaned = String(raw).replace(/^shf\s*/i, '').replace(/_/g, ' ').trim()
  if (!cleaned) return 'Shelf Section'
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' · ')
}

function formatCurrency(val) {
  if (typeof val !== 'number' || isNaN(val) || val <= 0) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

export default function Dashboard({
  user,
  isAdmin = false,
  onNavigate,
  onSelectOrder,
  onSelectScan,
  purchaseOrders = [],
  recentScans = [],
  inventory = [],
  totalScansCount = 0,
  isLoading = false,
  // eslint-disable-next-line no-unused-vars
  onGenerateOrder,
  onQuickApproveOrder,
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.full_name || user?.name || (isAdmin ? 'Store Admin' : 'Store Associate')
  const tenantName =
    user?.tenant_name ||
    user?.tenant?.name ||
    user?.store_name ||
    user?.company_name ||
    'Apex Retail'

  const pendingOrders = useMemo(
    () =>
      purchaseOrders.filter(
        (po) => po.status === 'Draft' || po.status === 'DRAFT' || po.status === 'Pending'
      ),
    [purchaseOrders]
  )

  const lowStockItems = useMemo(
    () =>
      inventory.filter(
        (item) => item.status === 'Low' || item.is_low_stock === true
      ),
    [inventory]
  )

  // Only show scans after they are successfully verified
  const visibleScans = useMemo(
    () =>
      recentScans.filter((scan) => {
        const st = (scan.status || '').toLowerCase()
        return st !== 'processing' && st !== 'pending'
      }),
    [recentScans]
  )

  const totalGaps = useMemo(
    () =>
      visibleScans.reduce(
        (sum, s) => sum + (s.empty_gaps_count ?? s.gaps ?? 0),
        0
      ),
    [visibleScans]
  )

  // Live analytics telemetry from /api/analytics
  const [liveAnalytics, setLiveAnalytics] = useState(null)
  const [approvingOrderId, setApprovingOrderId] = useState(null)

  useEffect(() => {
    let isSubscribed = true
    Promise.all([
      api.getLowStockAnalytics().catch(() => null),
      api.getGapAnalytics().catch(() => null),
    ])
      .then(([lowRes, gapRes]) => {
        if (!isSubscribed) return
        setLiveAnalytics({
          lowStockCount: lowRes?.total_low_stock_count,
          totalGaps: gapRes?.total_gaps_recorded,
        })
      })
      .catch(() => {})
    return () => {
      isSubscribed = false
    }
  }, [])

  const handleQuickApprove = async (e, orderId) => {
    e.stopPropagation()
    if (!onQuickApproveOrder || approvingOrderId) return
    setApprovingOrderId(orderId)
    try {
      await onQuickApproveOrder(orderId)
    } finally {
      setApprovingOrderId(null)
    }
  }

  const effectiveLowStockCount =
    liveAnalytics?.lowStockCount !== undefined
      ? liveAnalytics.lowStockCount
      : lowStockItems.length

  const effectiveTotalGaps =
    liveAnalytics?.totalGaps !== undefined
      ? liveAnalytics.totalGaps
      : totalGaps

  return (
    <div className="flex flex-col h-full w-full min-h-0 space-y-2.5">
      {/* ==================== TOP OPERATIONS HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
              Store Operations Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/90 text-slate-700">
              {tenantName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {greeting}, {displayName} · Live shelf monitoring & replenishment status
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('new-scan')}
            className="px-3.5 py-1.5 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-98 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Scan shelf</span>
          </button>
        </div>
      </div>

      {/* ==================== 4 PURPOSEFUL OPERATIONAL KPI CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
        {/* Card 1: Total Scans */}
        <div
          onClick={() => onNavigate('new-scan')}
          className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Scans
            </span>
            <ScanIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {totalScansCount || recentScans.length}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">verified scans</span>
          </div>
        </div>

        {/* Card 2: Empty Gaps Found */}
        <div
          onClick={() => onNavigate('analytics')}
          className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Shelf Gaps
            </span>
            <AlertTriangle className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  effectiveTotalGaps > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {effectiveTotalGaps}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">
              {effectiveTotalGaps > 0 ? 'needs restock' : 'shelf full'}
            </span>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Low Stock
            </span>
            <TrendingDown className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  effectiveLowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {effectiveLowStockCount}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">SKUs alert</span>
          </div>
        </div>

        {/* Card 4: Orders Pending Approval */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Needs Approval
            </span>
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#5956c6] transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  pendingOrders.length > 0 ? 'text-[#5956c6]' : 'text-slate-900'
                }`}
              >
                {pendingOrders.length}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">draft orders</span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN 2-COLUMN OPERATIONAL PANELS ==================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch h-full">
        {/* Left Column: Recent Shelf Scans */}
        <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Recent Shelf Scans</h2>
              <span className="text-[11px] font-semibold text-slate-500">
                ({visibleScans.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('new-scan')}
              className="text-xs font-semibold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View scan history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading shelf scans...</span>
              </div>
            ) : visibleScans.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <ScanIcon className="w-8 h-8 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600">No verified scans recorded yet</p>
                <p className="text-[11px] text-slate-400">
                  Take or upload a shelf photo to trigger AI gap detection.
                </p>
              </div>
            ) : (
              visibleScans.map((scan) => {
                const gapsCount = scan.empty_gaps_count ?? scan.gaps ?? 0
                const itemsCount = scan.total_detected_count ?? scan.items ?? 0
                const formattedShelf = formatShelfName(scan.shelf || scan.shelf_id)

                return (
                  <div
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer group shadow-2xs"
                  >
                    {/* Left: Shelf Info & Scan ID */}
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-blue-700 transition-colors">
                          {formattedShelf}
                        </p>
                        <span className="text-[10px] font-mono font-medium text-slate-400 truncate">
                          {scan.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>{scan.time || scan.date || 'Today'}</span>
                        <span>·</span>
                        <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'} detected</span>
                      </div>
                    </div>

                    {/* Right: Distinct Gap Health Badge (No repeated generic "Verified" badge) */}
                    <div className="shrink-0 flex items-center gap-2">
                      {gapsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/90">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{gapsCount} {gapsCount === 1 ? 'gap' : 'gaps'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                          <span>Fully stocked</span>
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Needs Approval (Purchase Orders) */}
        <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Needs Approval</h2>
              <span className="text-[11px] font-semibold text-slate-500">
                ({pendingOrders.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>Loading pending orders...</span>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-emerald-500 stroke-[1.5]" />
                <p className="font-semibold text-slate-700">All orders up to date</p>
                <p className="text-[11px] text-slate-400">
                  No draft purchase orders are currently awaiting managerial approval.
                </p>
              </div>
            ) : (
              pendingOrders.map((order) => {
                const itemCount = order.items?.length ?? 0
                const formattedTotal = formatCurrency(order.total)
                const isApprovingThis = approvingOrderId === order.id

                return (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer group shadow-2xs"
                  >
                    {/* Left: PO Metadata */}
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                          {order.id}
                        </span>
                        {formattedTotal && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {formattedTotal}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 truncate">
                        <span className="truncate">
                          {order.supplier || order.supplier_name || 'Primary Supplier'}
                        </span>
                        <span>·</span>
                        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                        <span>·</span>
                        <span>{order.date || 'Today'}</span>
                      </div>
                    </div>

                    {/* Right: Actions (Direct Quick Approve for Admin + Review) */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isAdmin && onQuickApproveOrder && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickApprove(e, order.id)}
                          disabled={isApprovingThis}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Quick approve and restock inventory"
                        >
                          {isApprovingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          )}
                          <span>Approve</span>
                        </button>
                      )}
                      <span className="text-xs font-medium text-slate-400 group-hover:text-slate-700 hidden sm:inline">
                        Review
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM SYSTEM STATUS STRIP ==================== */}
      <div className="bg-white rounded-md border border-slate-200/90 px-3 py-2 shrink-0 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">AI Vision Engine & Auto-Reorder:</span>
          <span>Automatic replenishment enabled on shelf gap detection</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>Inventory ({inventory.length} SKUs)</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => onNavigate('shelves')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Shelves</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Telemetry</span>
          </button>
        </div>
      </div>
    </div>
  )
}
