import { useMemo, useState } from 'react'
import {
  Package,
  TrendingDown,
  AlertCircle,
  Check,
  Loader2,
  Search,
  Camera,
  Layers,
  BarChart3,
  RotateCcw,
  Plus,
  Minus,
  LayoutGrid,
  List,
  Truck,
  ArrowUpRight,
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
  // Mode switcher: 'grid' (Visual Shelf Cards) | 'table' (Dense Inventory Matrix) | 'reorders' (Restock Pipeline)
  const [viewMode, setViewMode] = useState('grid')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | LOW | OUT | IN

  // Action Loading States
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

  // Stock Classification
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

  // Total Inventory Valuation ($)
  const totalValuation = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const cur = typeof item.current === 'number' ? item.current : 0
      const price = typeof item.price === 'number' ? item.price : 0
      return sum + cur * price
    }, 0)
  }, [inventory])

  // Extract Unique Categories for the Aisle/Category Ribbon
  const categories = useMemo(() => {
    const set = new Set()
    inventory.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['ALL', ...Array.from(set)]
  }, [inventory])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return inventory.filter((item) => {
      const cur = item.current ?? 0
      const min = item.minThreshold || 5
      const isLow =
        item.status === 'Low' || item.is_low_stock === true || (cur > 0 && cur <= min)

      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false
      }

      // Status filter
      if (statusFilter === 'LOW') {
        if (!isLow || cur === 0) return false
      } else if (statusFilter === 'OUT') {
        if (cur > 0) return false
      } else if (statusFilter === 'IN') {
        if (cur === 0 || isLow) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = (item.name || '').toLowerCase().includes(q)
        const skuMatch = (item.sku || '').toLowerCase().includes(q)
        const catMatch = (item.category || '').toLowerCase().includes(q)
        if (!nameMatch && !skuMatch && !catMatch) return false
      }

      return true
    })
  }, [inventory, selectedCategory, statusFilter, searchQuery])

  // Interactive Stock Step Adjustment (+ / -) directly on the Visual Card
  const handleAdjustStock = async (e, item, delta) => {
    e.stopPropagation()
    if (!onUpdateProduct || updatingItemId) return
    const newQty = Math.max(0, (item.current || 0) + delta)
    setUpdatingItemId(item.id)
    try {
      await onUpdateProduct({
        id: item.id,
        productId: item.productId || item.id,
        current: newQty,
        target: item.target || 20,
      })
    } finally {
      setUpdatingItemId(null)
    }
  }

  // Quick Restock to Full Target Capacity
  const handleFullRestock = async (e, item) => {
    e.stopPropagation()
    if (!onUpdateProduct || updatingItemId) return
    const targetQty = item.target || 20
    setUpdatingItemId(item.id)
    try {
      await onUpdateProduct({
        id: item.id,
        productId: item.productId || item.id,
        current: targetQty,
        target: targetQty,
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

  // Trigger PO for Low Stock Items
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
      {/* ==================== 1. STORE COMMAND BAR (HEADER & VIEW TOGGLE) ==================== */}
      <div className="bg-white rounded-md border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Left: Store Meta & Quick Telemetry Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Store Inventory Hub
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AI Vision Connected</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Apex Retail · Real-time shelf product matrix & replenishment
            </p>
          </div>

          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-200/80 text-xs">
            <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold text-[11px]">
              Valuation: <strong className="text-slate-900">{formatCurrency(totalValuation)}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold text-[11px]">
              SKUs: <strong className="text-slate-900">{inventory.length}</strong>
            </span>
            {lowStockItems.length > 0 && (
              <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200/80 text-amber-700 font-bold text-[11px]">
                Low Stock: {lowStockItems.length}
              </span>
            )}
          </div>
        </div>

        {/* Right: View Mode Segmented Controls + Primary Scan CTA */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {/* Segmented View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visual Shelf Product Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shelf Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Inventory Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('reorders')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer relative ${
                viewMode === 'reorders'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Restock & Reorder Orders"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Reorders</span>
              {pendingOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#5956c6] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Primary CTA: Scan Shelf Now */}
          <button
            type="button"
            onClick={() => onNavigate('new-scan')}
            className="px-3.5 py-1.5 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-98 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>AI Camera Scan</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. AISLE / CATEGORY & SEARCH FILTER BAR ==================== */}
      <div className="bg-white rounded-md border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        {/* Search Input */}
        <div className="relative min-w-[200px] sm:max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU..."
            className="w-full pl-8 pr-6 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-[#5956c6] focus:ring-1 focus:ring-[#5956c6] placeholder:text-slate-400 text-slate-800 transition-all bg-slate-50/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Status Quick Filters */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === 'LOW'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/70'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            <span>Low Stock ({lowStockItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'OUT' ? 'ALL' : 'OUT')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === 'OUT'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Out of Stock ({outOfStockItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'IN' ? 'ALL' : 'IN')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === 'IN'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>In Stock ({inStockItems.length})</span>
          </button>

          <span className="text-slate-300">|</span>

          {/* Category Pills */}
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Aisles' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 3. MAIN WORKSPACE VIEW MODES ==================== */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {/* ==================== MODE A: VISUAL SHELF PRODUCT GRID ==================== */}
        {viewMode === 'grid' && (
          <div className="h-full flex flex-col">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#5956c6]" />
                <span>Loading visual store shelves...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Package className="w-10 h-10 text-slate-300 stroke-1" />
                <p className="font-bold text-slate-700 text-sm">No products found</p>
                <p className="text-slate-400">
                  {searchQuery || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
                    ? 'No products match your active search or filters.'
                    : 'Your store catalog is empty.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                    setSelectedCategory('ALL')
                  }}
                  className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2">
                {filteredProducts.map((item) => {
                  const cur = item.current ?? 0
                  const target = item.target || 20
                  const min = item.minThreshold || 5
                  const isOutOfStock = cur === 0
                  const isLow =
                    !isOutOfStock &&
                    (item.status === 'Low' || item.is_low_stock === true || cur <= min)
                  const pct = Math.min(100, Math.round((cur / Math.max(target, 1)) * 100))
                  const isUpdating = updatingItemId === item.id

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-md border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between p-3.5 group relative overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 ${
                          isOutOfStock
                            ? 'bg-rose-500'
                            : isLow
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />

                      {/* Card Header: Category & Price */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category || 'General'}
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs">
                            {formatCurrency(item.price)}
                          </span>
                        </div>

                        {/* Product Title & SKU */}
                        <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug line-clamp-2">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <span className="font-mono text-slate-500">{item.sku}</span>
                          {item.shelf_location && (
                            <>
                              <span>·</span>
                              <span className="text-slate-500 font-medium">
                                {item.shelf_location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Middle: Stock Capacity Meter & Visual Gauge */}
                      <div className="my-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[11px] font-semibold text-slate-500">Shelf Stock:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {cur} / {target} units
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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

                        {/* Status Label */}
                        <div className="flex items-center justify-between text-[11px] mt-1.5">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Out of stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                              <TrendingDown className="w-3 h-3" />
                              <span>Low stock alert</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <Check className="w-3 h-3" />
                              <span>Well stocked</span>
                            </span>
                          )}
                          <span className="text-slate-400 font-mono text-[10px]">{pct}% full</span>
                        </div>
                      </div>

                      {/* Card Footer: Interactive Shopkeeper Stepper Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {/* Stepper Buttons (-1 and +1) */}
                        {isAdmin && onUpdateProduct ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleAdjustStock(e, item, -1)}
                              disabled={isUpdating || cur <= 0}
                              className="w-7 h-7 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
                              title="Decrease shelf stock (-1)"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-mono font-bold text-slate-800">
                              {cur}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleAdjustStock(e, item, +1)}
                              disabled={isUpdating}
                              className="w-7 h-7 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
                              title="Increase shelf stock (+1)"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-500 font-bold">
                            Stock: {cur}
                          </span>
                        )}

                        {/* Action: Quick Restock or Edit */}
                        {isAdmin && onUpdateProduct && (isLow || isOutOfStock) ? (
                          <button
                            type="button"
                            onClick={(e) => handleFullRestock(e, item)}
                            disabled={isUpdating}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-95 text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Restock to full capacity"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span>Restock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('inventory')}
                            className="text-xs font-semibold text-slate-400 group-hover:text-[#5956c6] flex items-center gap-0.5 cursor-pointer transition-colors"
                          >
                            <span>Manage</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== MODE B: DENSE INVENTORY MATRIX (TABLE VIEW) ==================== */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Shelf Location</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3">Stock Level</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((item) => {
                    const cur = item.current ?? 0
                    const target = item.target || 20
                    const min = item.minThreshold || 5
                    const isOutOfStock = cur === 0
                    const isLow =
                      !isOutOfStock &&
                      (item.status === 'Low' || item.is_low_stock === true || cur <= min)
                    const isUpdating = updatingItemId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-semibold">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {item.shelf_location || 'Aisle 1'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">
                              {cur} / {target}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Out of stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <TrendingDown className="w-3 h-3 text-amber-600" />
                              <span>Low stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>In Stock</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isAdmin && onUpdateProduct && (isLow || isOutOfStock) ? (
                            <button
                              type="button"
                              onClick={(e) => handleFullRestock(e, item)}
                              disabled={isUpdating}
                              className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#5956c6] hover:bg-[#4d4ab5] text-white cursor-pointer"
                            >
                              Restock
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigate('inventory')}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== MODE C: RESTOCK PIPELINE & PURCHASE ORDERS ==================== */}
        {viewMode === 'reorders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
            {/* Left 8 cols: Pending Orders */}
            <div className="lg:col-span-8 bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col p-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Purchase Orders Awaiting Approval</h2>
                  <p className="text-xs text-slate-500">
                    Auto-generated replenishment orders waiting for store manager sign-off.
                  </p>
                </div>
                {lowStockItems.length > 0 && onGenerateOrder && (
                  <button
                    type="button"
                    onClick={handleTriggerPO}
                    disabled={isGeneratingPO}
                    className="px-3 py-1.5 rounded bg-[#5956c6] hover:bg-[#4d4ab5] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    {isGeneratingPO ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    )}
                    <span>Generate Draft PO</span>
                  </button>
                )}
              </div>

              <div className="pt-3 space-y-2.5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                {pendingOrders.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Check className="w-8 h-8 text-emerald-500 stroke-[1.5]" />
                    <p className="font-bold text-slate-700 text-sm">All purchase orders approved</p>
                    <p className="text-slate-400 max-w-xs">
                      No draft reorders are waiting. Your store inventory is in sync.
                    </p>
                  </div>
                ) : (
                  pendingOrders.map((order) => {
                    const itemCount = order.items?.length ?? 0
                    const isApproving = approvingOrderId === order.id

                    return (
                      <div
                        key={order.id}
                        onClick={() => onSelectOrder && onSelectOrder(order)}
                        className="p-3.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {order.id}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Draft
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {order.supplier || 'Primary Supplier'} · {itemCount} items · {order.date || 'Today'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {formatCurrency(order.total)}
                          </span>

                          {isAdmin && onQuickApproveOrder && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickApprove(e, order.id)}
                              disabled={isApproving}
                              className="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                              {isApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

            {/* Right 4 cols: Supplier & Replenishment Quick Info */}
            <div className="lg:col-span-4 bg-white rounded-md border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Restock Workflow</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When shelf products hit safety thresholds, draft purchase orders are automatically prepared. Approve orders here to restock your store.
                </p>

                <div className="mt-4 space-y-2">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200/70 text-xs flex justify-between">
                    <span className="text-slate-600">Pending Orders:</span>
                    <strong className="text-slate-900 font-mono">{pendingOrders.length}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200/70 text-xs flex justify-between">
                    <span className="text-slate-600">Items Needing Restock:</span>
                    <strong className="text-amber-600 font-mono">{lowStockItems.length + outOfStockItems.length}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Open Full Orders View</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 4. BOTTOM SHOPKEEPER STATUS DOCK ==================== */}
      <div className="bg-white rounded-md border border-slate-200/90 px-3 py-2 shrink-0 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Store Operations Dock:</span>
          <span>
            {inventory.length} total SKUs · {lowStockItems.length} low stock alerts · AI Vision Ready
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>Catalog</span>
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
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}
