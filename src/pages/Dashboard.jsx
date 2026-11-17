import { useMemo, useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Package,
  Scan as ScanIcon,
  TrendingDown,
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  ArrowRight,
  Search,
  Camera,
  Layers,
  BarChart3,
  Truck,
  RotateCcw,
} from 'lucide-react'

function formatCurrency(val) {
  if (typeof val !== 'number' || isNaN(val) || val <= 0) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

export default function Dashboard({
  // eslint-disable-next-line no-unused-vars
  user,
  isAdmin = false,
  onNavigate,
  onSelectOrder,
  // eslint-disable-next-line no-unused-vars
  onSelectScan,
  purchaseOrders = [],
  // eslint-disable-next-line no-unused-vars
  recentScans = [],
  inventory = [],
  // eslint-disable-next-line no-unused-vars
  totalScansCount = 0,
  isLoading = false,
  onGenerateOrder,
  onQuickApproveOrder,
  onUpdateProduct,
}) {
  // Inventory Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | LOW | OUT | IN
  const [updatingItemId, setUpdatingItemId] = useState(null)
  const [approvingOrderId, setApprovingOrderId] = useState(null)
  const [isGeneratingPO, setIsGeneratingPO] = useState(false)

  // Pending Purchase Orders awaiting shopkeeper approval
  const pendingOrders = useMemo(
    () =>
      purchaseOrders.filter(
        (po) => po.status === 'Draft' || po.status === 'DRAFT' || po.status === 'Pending'
      ),
    [purchaseOrders]
  )

  // Stock Classification for Shopkeeper
  const lowStockItems = useMemo(
    () =>
      inventory.filter((item) => {
        const cur = item.current ?? 0
        const min = item.minThreshold || 5
        return (
          (item.status === 'Low' || item.is_low_stock === true || (cur > 0 && cur <= min)) &&
          cur > 0
        )
      }),
    [inventory]
  )

  const outOfStockItems = useMemo(
    () => inventory.filter((item) => (item.current ?? 0) === 0),
    [inventory]
  )

  const inStockItems = useMemo(
    () =>
      inventory.filter((item) => {
        const cur = item.current ?? 0
        const min = item.minThreshold || 5
        const isLow =
          item.status === 'Low' || item.is_low_stock === true || (cur > 0 && cur <= min)
        return cur > 0 && !isLow
      }),
    [inventory]
  )

  // Filtered inventory based on search query and active tab
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Status filter
      if (statusFilter === 'LOW') {
        const cur = item.current ?? 0
        const min = item.minThreshold || 5
        const isLow =
          item.status === 'Low' || item.is_low_stock === true || (cur > 0 && cur <= min)
        if (!isLow || cur === 0) return false
      } else if (statusFilter === 'OUT') {
        if ((item.current ?? 0) > 0) return false
      } else if (statusFilter === 'IN') {
        const cur = item.current ?? 0
        const min = item.minThreshold || 5
        const isLow =
          item.status === 'Low' || item.is_low_stock === true || (cur > 0 && cur <= min)
        if (cur === 0 || isLow) return false
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = (item.name || '').toLowerCase().includes(q)
        const skuMatch = (item.sku || '').toLowerCase().includes(q)
        const catMatch = (item.category || '').toLowerCase().includes(q)
        if (!nameMatch && !skuMatch && !catMatch) return false
      }

      return true
    })
  }, [inventory, statusFilter, searchQuery])

  // Live analytics telemetry from /api/analytics
  const [liveAnalytics, setLiveAnalytics] = useState(null)

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

  // Quick Restock Action for Shopkeepers
  const handleQuickRestock = async (e, item) => {
    e.stopPropagation()
    if (!onUpdateProduct || updatingItemId) return
    setUpdatingItemId(item.id)
    try {
      const restockQty = Math.max(item.target || 20, (item.current || 0) + 10)
      await onUpdateProduct({
        id: item.id,
        productId: item.productId || item.id,
        current: restockQty,
        target: item.target || 20,
      })
    } finally {
      setUpdatingItemId(null)
    }
  }

  // Quick Approve Order for Shopkeepers
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

  // Handle Triggering Draft PO for Low Stock Items
  const handleTriggerPO = async () => {
    if (!onGenerateOrder || isGeneratingPO) return
    setIsGeneratingPO(true)
    try {
      await onGenerateOrder()
    } finally {
      setIsGeneratingPO(false)
    }
  }

  const effectiveLowStockCount =
    liveAnalytics?.lowStockCount !== undefined
      ? liveAnalytics.lowStockCount
      : lowStockItems.length

  const effectiveGapsCount =
    liveAnalytics?.totalGaps !== undefined
      ? liveAnalytics.totalGaps
      : outOfStockItems.length

  return (
    <div className="flex flex-col h-full w-full min-h-0 space-y-2.5">
      {/* ==================== SHOPKEEPER AI SCANNER ACTION BANNER ==================== */}
      <div className="bg-gradient-to-r from-slate-900 via-[#2e2b5e] to-[#3F4168] rounded-md p-3 sm:p-3.5 text-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white shadow-inner">
            <Camera className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                AI Shelf Vision Scanner
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Vision Agent Active</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 truncate">
              Point camera or upload shelf photos to detect empty gaps, count inventory, and auto-trigger replenishment orders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('new-scan')}
            className="px-3.5 py-1.5 sm:py-2 rounded-md bg-[#5956c6] hover:bg-[#6c69d8] active:scale-98 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer border border-white/20"
          >
            <ScanIcon className="w-4 h-4 stroke-[2.2]" />
            <span>Scan Shelf Now</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 sm:py-2 rounded-md bg-white/10 hover:bg-white/20 active:scale-98 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
            title="Open complete inventory management"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Catalog</span>
          </button>
        </div>
      </div>

      {/* ==================== 4 SHOPKEEPER INVENTORY KPI METRICS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
        {/* Metric 1: Total Store Products */}
        <div
          onClick={() => {
            setStatusFilter('ALL')
            setSearchQuery('')
          }}
          className={`p-3 sm:p-3.5 rounded-md border shadow-2xs transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilter === 'ALL'
              ? 'bg-blue-50/40 border-blue-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Store Products
            </span>
            <Package className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {inventory.length}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">active SKUs</span>
          </div>
        </div>

        {/* Metric 2: Low Stock Alerts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-3 sm:p-3.5 rounded-md border shadow-2xs transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilter === 'LOW'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <TrendingDown className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  effectiveLowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {effectiveLowStockCount}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">needs restock</span>
          </div>
        </div>

        {/* Metric 3: Out of Stock / Shelf Gaps */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={`p-3 sm:p-3.5 rounded-md border shadow-2xs transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilter === 'OUT'
              ? 'bg-rose-50 border-rose-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Shelf Gaps (Out)
            </span>
            <AlertTriangle className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  effectiveGapsCount > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {effectiveGapsCount}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">
              {effectiveGapsCount > 0 ? 'empty on shelf' : 'shelves stocked'}
            </span>
          </div>
        </div>

        {/* Metric 4: Auto-Reorder Orders Pending */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Reorders to Approve
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
            <span className="text-[11px] font-medium text-slate-400">draft POs</span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN 2-COLUMN OPERATIONAL PANELS ==================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch h-full">
        {/* Left Column (7 cols): Live Shelf Inventory for Shopkeeper */}
        <div className="lg:col-span-7 bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
          {/* Panel Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Live Shelf Inventory</h2>
              <span className="text-[11px] font-semibold text-slate-500">
                ({filteredInventory.length} of {inventory.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Full catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Bar + Filter Tabs */}
          <div className="p-2.5 border-b border-slate-100 bg-white space-y-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, or category..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-[#5956c6] focus:ring-1 focus:ring-[#5956c6] placeholder:text-slate-400 text-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({inventory.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('LOW')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'LOW'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <span>Low Stock</span>
                <span className="font-mono text-[10px]">({lowStockItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('OUT')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'OUT'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <span>Out of Stock</span>
                <span className="font-mono text-[10px]">({outOfStockItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('IN')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'IN'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <span>In Stock</span>
                <span className="font-mono text-[10px]">({inStockItems.length})</span>
              </button>
            </div>
          </div>

          {/* Product Items List */}
          <div className="flex-1 min-h-0 p-2.5 space-y-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#5956c6]" />
                <span>Loading store inventory...</span>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Package className="w-8 h-8 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-700">No products match your filter</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery
                    ? `No products found matching "${searchQuery}".`
                    : 'No inventory items in this status filter.'}
                </p>
                {(searchQuery || statusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('ALL')
                    }}
                    className="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredInventory.map((item) => {
                const cur = item.current ?? 0
                const target = item.target || 20
                const min = item.minThreshold || 5
                const priceFormatted = formatCurrency(item.price)
                const isOutOfStock = cur === 0
                const isLow =
                  !isOutOfStock &&
                  (item.status === 'Low' || item.is_low_stock === true || cur <= min)
                const isUpdatingThis = updatingItemId === item.id
                const pct = Math.min(100, Math.round((cur / Math.max(target, 1)) * 100))

                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('inventory')}
                    className="p-3 rounded-md border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer group shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Product Name, SKU, Category */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#5956c6] transition-colors">
                          {item.name}
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="font-mono text-slate-500 font-semibold">{item.sku}</span>
                        <span>·</span>
                        <span>{priceFormatted || '$0.00'}</span>
                        {item.shelf_location && (
                          <>
                            <span>·</span>
                            <span className="text-slate-500">{item.shelf_location}</span>
                          </>
                        )}
                      </div>

                      {/* Stock Level Progress Bar */}
                      <div className="mt-2 flex items-center gap-2 max-w-xs">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock
                                ? 'bg-rose-500 w-full'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: isOutOfStock ? '100%' : `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600 shrink-0">
                          {cur} / {target} units
                        </span>
                      </div>
                    </div>

                    {/* Right: Status Pill & Action */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <TrendingDown className="w-3 h-3 text-amber-600" />
                          <span>Low Stock ({cur})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                          <span>In Stock</span>
                        </span>
                      )}

                      {/* Quick Restock Action for Shopkeeper / Admin */}
                      {isAdmin && onUpdateProduct && (isLow || isOutOfStock) && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickRestock(e, item)}
                          disabled={isUpdatingThis}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-95 text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                          title="Quick restock item by adding target units"
                        >
                          {isUpdatingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>Restock</span>
                        </button>
                      )}

                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Auto-Reorder Orders for Shopkeeper */}
        <div className="lg:col-span-5 bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
          {/* Panel Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Auto-Reorder Orders</h2>
              <span className="text-[11px] font-semibold text-slate-500">
                ({pendingOrders.length} pending)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>All orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subheader Hint for Shopkeeper */}
          <div className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Truck className="w-3.5 h-3.5 text-[#5956c6] shrink-0" />
              <span className="text-[11px] font-medium text-slate-600 truncate">
                Triggered automatically by AI shelf vision & low stock gaps
              </span>
            </div>
            {effectiveLowStockCount > 0 && onGenerateOrder && (
              <button
                type="button"
                onClick={handleTriggerPO}
                disabled={isGeneratingPO}
                className="text-[11px] font-bold text-[#5956c6] hover:text-[#4d4ab5] shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {isGeneratingPO ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>+ Create PO</span>
                )}
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 min-h-0 p-2.5 space-y-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>Loading pending reorders...</span>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Check className="w-8 h-8 text-emerald-500 stroke-[1.5]" />
                <p className="font-semibold text-slate-700">All shelves replenished</p>
                <p className="text-[11px] text-slate-400 max-w-[240px]">
                  No draft purchase orders are pending approval. Run an AI Shelf Scan to inspect aisles for new gaps.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('new-scan')}
                  className="mt-2 px-3 py-1.5 bg-[#5956c6] hover:bg-[#4d4ab5] text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <ScanIcon className="w-3.5 h-3.5" />
                  <span>Scan Shelves</span>
                </button>
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
                    className="p-3 rounded-md border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer group shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#5956c6] transition-colors">
                          {order.id}
                        </span>
                        {formattedTotal && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {formattedTotal}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Draft
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[180px]">
                        {order.supplier || order.supplier_name || 'Primary Supplier'}
                      </span>
                      <span>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'} · {order.date || 'Today'}
                      </span>
                    </div>

                    {/* Action Buttons for Shopkeeper */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOrder && onSelectOrder(order)
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        Review
                      </button>

                      {isAdmin && onQuickApproveOrder && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickApprove(e, order.id)}
                          disabled={isApprovingThis}
                          className="px-3 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                          title="Approve purchase order and restock store inventory"
                        >
                          {isApprovingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>Approve & Restock</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM SHOPKEEPER STATUS STRIP ==================== */}
      <div className="bg-white rounded-md border border-slate-200/90 px-3 py-2 shrink-0 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">AI Shelf Scanner for Shopkeepers:</span>
          <span>Automatic gap detection & inventory restocking active</span>
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
            <span>Shelves & Aisles</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Vision Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}
