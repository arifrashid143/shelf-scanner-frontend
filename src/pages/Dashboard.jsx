import { useMemo, useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Plus,
  Package,
  TrendingDown,
  Loader2,
  FileText,
  ArrowRight,
} from 'lucide-react'

export default function Dashboard({
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
  // eslint-disable-next-line no-unused-vars
  onGenerateOrder,
  // eslint-disable-next-line no-unused-vars
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
      inventory.filter((item) => {
        const cur = item.current ?? 0
        const min = item.minThreshold || 5
        return item.status === 'Low' || item.is_low_stock === true || cur <= min
      }),
    [inventory]
  )

  // Display low stock items first; if none are low stock, show all inventory items
  const displayedInventoryItems = useMemo(() => {
    if (lowStockItems.length > 0) return lowStockItems
    return inventory
  }, [lowStockItems, inventory])

  // Live analytics telemetry from /api/analytics
  const [liveAnalytics, setLiveAnalytics] = useState(null)

  useEffect(() => {
    let isSubscribed = true
    api
      .getLowStockAnalytics()
      .then((lowRes) => {
        if (!isSubscribed) return
        setLiveAnalytics({
          lowStockCount: lowRes?.total_low_stock_count,
        })
      })
      .catch(() => {})
    return () => {
      isSubscribed = false
    }
  }, [])

  const effectiveLowStockCount =
    liveAnalytics?.lowStockCount !== undefined
      ? liveAnalytics.lowStockCount
      : lowStockItems.length

  return (
    <div className="flex flex-col h-full w-full min-h-0 space-y-2.5">
      {/* Top Greeting Header Row + New scan button */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none truncate">
            {greeting}, {displayName}
          </h1>
          <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
            {tenantName}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('new-scan')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New scan</span>
        </button>
      </div>

      {/* 3 Stat KPI Cards: Total products, Low stock, Needs approval */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
        {/* Card 1: Total products in inventory */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all flex items-start justify-between cursor-pointer group"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total products</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                {inventory.length}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Low stock in inventory */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-rose-300 transition-all flex items-start justify-between cursor-pointer group"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Low stock alerts</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-rose-600 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                {effectiveLowStockCount}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/90 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <TrendingDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Needs approval */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex items-start justify-between cursor-pointer group"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Needs approval</p>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 mt-1" />
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                {pendingOrders.length}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/90 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid: Low stock in inventory & Needs approval */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch h-full">
        {/* Left Column: Low stock in inventory */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs flex flex-col h-full min-h-0">
          <div className="pb-2.5 border-b border-slate-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Low stock in inventory</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {lowStockItems.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 pt-2.5 space-y-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Loading inventory...</span>
              </div>
            ) : displayedInventoryItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No low stock items. All products are well stocked in inventory.
              </div>
            ) : (
              displayedInventoryItems.map((item) => {
                const cur = item.current ?? 0
                const target = item.target || 20
                const min = item.minThreshold || 5
                const isZero = cur === 0
                const isLow = cur <= min || item.status === 'Low' || item.is_low_stock === true

                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('inventory')}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isZero
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : isLow
                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        }`}
                      >
                        {isLow ? (
                          <TrendingDown className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <Package className="w-4 h-4 stroke-[2]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                          {item.sku} · {cur} in stock (Target: {target})
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isZero
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isZero ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Needs approval */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs flex flex-col h-full min-h-0">
          <div className="pb-2.5 border-b border-slate-100 shrink-0 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Needs approval</h2>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 pt-2.5 space-y-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span>Loading pending orders...</span>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders pending approval. All orders are up to date.
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder && onSelectOrder(order)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">
                        {order.id}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                        {order.supplier || order.supplier_name || 'Supplier'} · {order.items?.length ?? 0} items
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2.5">
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
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
