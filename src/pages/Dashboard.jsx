import { useMemo, useState } from 'react'
import {
  Package,
  DollarSign,
  TrendingDown,
  AlertCircle,
  Check,
  Loader2,
  FileText,
  ArrowRight,
  Search,
  Camera,
  Layers,
  BarChart3,
  RotateCcw,
  Plus,
} from 'lucide-react'

function formatCurrency(val) {
  if (typeof val !== 'number' || isNaN(val) || val < 0) return '$0.00'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | LOW | OUT | IN
  const [updatingItemId, setUpdatingItemId] = useState(null)
  const [approvingOrderId, setApprovingOrderId] = useState(null)
  const [isGeneratingPO, setIsGeneratingPO] = useState(false)

  // Pending Purchase Orders awaiting manager approval
  const pendingOrders = useMemo(
    () =>
      purchaseOrders.filter(
        (po) => po.status === 'Draft' || po.status === 'DRAFT' || po.status === 'Pending'
      ),
    [purchaseOrders]
  )

  // Total Inventory Value ($ valuation)
  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const cur = typeof item.current === 'number' ? item.current : 0
      const price = typeof item.price === 'number' ? item.price : 0
      return sum + cur * price
    }, 0)
  }, [inventory])

  // Low Stock Items
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

  // Out of Stock Items
  const outOfStockItems = useMemo(
    () => inventory.filter((item) => (item.current ?? 0) === 0),
    [inventory]
  )

  // In Stock / Healthy Items
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

  // Category Distribution & Health
  const categorySummary = useMemo(() => {
    const map = {}
    inventory.forEach((item) => {
      const cat = item.category || 'General'
      if (!map[cat]) map[cat] = { count: 0, lowCount: 0, outCount: 0 }
      map[cat].count += 1
      const cur = item.current ?? 0
      const min = item.minThreshold || 5
      if (cur === 0) map[cat].outCount += 1
      else if (cur <= min || item.status === 'Low') map[cat].lowCount += 1
    })
    return Object.entries(map).map(([name, data]) => ({ name, ...data }))
  }, [inventory])

  // Filtered inventory based on search and status tabs
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const cur = item.current ?? 0
      const min = item.minThreshold || 5
      const isLow =
        item.status === 'Low' || item.is_low_stock === true || (cur > 0 && cur <= min)

      if (statusFilter === 'LOW') {
        if (!isLow || cur === 0) return false
      } else if (statusFilter === 'OUT') {
        if (cur > 0) return false
      } else if (statusFilter === 'IN') {
        if (cur === 0 || isLow) return false
      }

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

  // Quick Restock Action
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

  // Quick Approve Order
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

  // Handle Triggering Draft PO
  const handleTriggerPO = async () => {
    if (!onGenerateOrder || isGeneratingPO) return
    setIsGeneratingPO(true)
    try {
      await onGenerateOrder()
    } finally {
      setIsGeneratingPO(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 space-y-2.5">
      {/* ==================== CLEAN TOP ACTION BAR ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
              Store Inventory & Operations
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AI Reorder Active</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time shelf stock levels, automated replenishment & catalog management
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('new-scan')}
            className="px-3.5 py-1.5 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-98 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>AI Camera Scan</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 active:scale-98 border border-slate-200/90 text-slate-700 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ==================== 4 PROFESSIONAL KPI CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Inventory Valuation */}
        <div className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Stock Valuation
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <DollarSign className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalInventoryValue)}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">on-shelf value</span>
          </div>
        </div>

        {/* Card 2: Total Store SKUs */}
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
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <Package className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {inventory.length}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">active catalog SKUs</span>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-3 sm:p-3.5 rounded-md border shadow-2xs transition-all cursor-pointer group flex flex-col justify-between ${
            statusFilter === 'LOW'
              ? 'bg-amber-50/60 border-amber-300'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <TrendingDown className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {lowStockItems.length}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">needs restock</span>
          </div>
        </div>

        {/* Card 4: Orders to Approve */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-3 sm:p-3.5 rounded-md border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Reorders
            </span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-[#5956c6] flex items-center justify-center shrink-0 border border-purple-100 group-hover:bg-purple-100 transition-colors">
              <FileText className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <span
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  pendingOrders.length > 0 ? 'text-[#5956c6]' : 'text-slate-900'
                }`}
              >
                {pendingOrders.length}
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">draft POs to approve</span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN 2-COLUMN OPERATIONAL PANELS ==================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch h-full">
        {/* Left Column (7 cols): Store Shelf Inventory Catalog */}
        <div className="lg:col-span-7 bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
          {/* Panel Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Store Shelf Products</h2>
              <span className="text-[11px] font-semibold text-slate-500">
                ({filteredInventory.length} of {inventory.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Manage catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
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
                    : 'No inventory items currently in this status.'}
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
                        <span className="text-slate-600 font-medium">{priceFormatted}</span>
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
                          <AlertCircle className="w-3 h-3 text-rose-600" />
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
                          title="Restock units"
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

        {/* Right Column (5 cols): Reorders & Category Stock Summary */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 space-y-2.5">
          {/* Top Half: Reorders to Approve */}
          <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Panel Header */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Reorders to Approve</h2>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({pendingOrders.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {lowStockItems.length > 0 && onGenerateOrder && (
                  <button
                    type="button"
                    onClick={handleTriggerPO}
                    disabled={isGeneratingPO}
                    className="text-[11px] font-bold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer"
                  >
                    {isGeneratingPO ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>+ Create PO</span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className="text-xs font-semibold text-[#5956c6] hover:text-[#4d4ab5] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 min-h-0 p-2.5 space-y-2 overflow-y-auto no-scrollbar">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  <span>Loading pending reorders...</span>
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Check className="w-7 h-7 text-emerald-500 stroke-[1.5]" />
                  <p className="font-semibold text-slate-700">All purchase orders approved</p>
                  <p className="text-[11px] text-slate-400 max-w-[220px]">
                    No draft orders are currently pending. All shelves are adequately stocked.
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

                      {/* Action Buttons */}
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
                            title="Approve order and restock inventory"
                          >
                            {isApprovingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Bottom Half: Category Stock Health Breakdown */}
          <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-900">Category Stock Health</h2>
              <span className="text-[11px] font-semibold text-slate-500">
                {categorySummary.length} categories
              </span>
            </div>

            <div className="flex-1 min-h-0 p-3 space-y-2.5 overflow-y-auto no-scrollbar">
              {categorySummary.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No category data available.
                </div>
              ) : (
                categorySummary.map((cat) => {
                  const hasAlerts = cat.lowCount > 0 || cat.outCount > 0
                  return (
                    <div
                      key={cat.name}
                      onClick={() => {
                        setSearchQuery(cat.name)
                        setStatusFilter('ALL')
                      }}
                      className="p-2.5 rounded-md border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {cat.count} {cat.count === 1 ? 'product' : 'products'} tracked
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasAlerts ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <TrendingDown className="w-3 h-3 text-amber-600" />
                            <span>{cat.lowCount + cat.outCount} alert</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Healthy</span>
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM STATUS STRIP ==================== */}
      <div className="bg-white rounded-md border border-slate-200/90 px-3 py-2 shrink-0 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">Store Operations Engine:</span>
          <span>Live catalog monitoring & smart replenishment active</span>
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
