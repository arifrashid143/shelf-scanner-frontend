import { useState } from 'react'
import {
  Scan,
  TrendingDown,
  Search,
  Check,
  Loader2,
  FileText,
  Sparkles,
  X,
  MessageSquare,
} from 'lucide-react'

export default function AdminDashboardView({
  onSelectOrder,
  onSelectScan,
  purchaseOrders = [],
  recentScans = [],
  inventory = [],
  totalScansCount = 0,
  isLoading = false,
}) {
  const [isGeminiOpen, setIsGeminiOpen] = useState(false)
  const [geminiQuery, setGeminiQuery] = useState('')
  const [geminiResponse, setGeminiResponse] = useState(null)

  const pendingOrders = purchaseOrders.filter(
    (po) => po.status === 'Draft' || po.status === 'DRAFT' || po.status === 'Pending'
  )
  const lowStockItems = inventory.filter(
    (item) => item.status === 'Low' || item.is_low_stock === true
  )

  // Only show scans after they are successfully verified
  const visibleScans = recentScans.filter((scan) => {
    const st = (scan.status || '').toLowerCase()
    return st !== 'processing' && st !== 'pending'
  })

  const totalGaps = visibleScans.reduce(
    (sum, s) => sum + (s.empty_gaps_count ?? s.gaps ?? 0),
    0
  )

  const visibleOrders = pendingOrders

  const handleAskGemini = (prompt) => {
    const q = prompt || geminiQuery
    if (!q.trim()) return

    const lowerQ = q.toLowerCase()
    let answer

    if (lowerQ.includes('gap') || lowerQ.includes('empty')) {
      answer = `Visual AI scan analysis reveals ${totalGaps} total shelf gaps detected across ${visibleScans.length} verified scans. Recommended action: Restock high-frequency sections to improve shelf facings.`
    } else if (lowerQ.includes('low') || lowerQ.includes('stock') || lowerQ.includes('inventory')) {
      answer = `You currently have ${lowStockItems.length} product(s) flagged as low stock (below minimum safety threshold). Immediate restock POs should be reviewed in the Needs Approval queue.`
    } else if (lowerQ.includes('po') || lowerQ.includes('order') || lowerQ.includes('approval')) {
      answer = `There are ${pendingOrders.length} purchase order(s) awaiting store manager sign-off. The top order is ${pendingOrders[0]?.id || 'N/A'} for ${pendingOrders[0]?.supplier || 'primary supplier'}.`
    } else {
      answer = `Shelf telemetry summary: ${totalScansCount || visibleScans.length} total scans logged, ${lowStockItems.length} products low on stock, and ${pendingOrders.length} draft purchase orders pending approval.`
    }

    setGeminiResponse({ question: q, answer })
    setGeminiQuery('')
  }

  return (
    <div className="flex flex-col min-h-full lg:h-full lg:max-h-full space-y-5 w-full min-h-0">
      {/* 3 Stat KPI Cards matching mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 shrink-0">
        {/* Card 1: TOTAL SCANS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              TOTAL SCANS
            </p>
            <div className="w-9 h-9 rounded-lg bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
              <Scan className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {totalScansCount || recentScans.length}
            </p>
          )}
        </div>

        {/* Card 2: LOW STOCK */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              LOW STOCK
            </p>
            <div className="w-9 h-9 rounded-lg bg-[#fff1f2] text-[#f43f5e] flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {lowStockItems.length}
            </p>
          )}
        </div>

        {/* Card 3: GAPS FOUND */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              GAPS FOUND
            </p>
            <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-1" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {totalGaps}
            </p>
          )}
        </div>
      </div>

      {/* Main 2-Column Content Grid: SCAN HISTORY & NEEDS APPROVAL */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Column: SCAN HISTORY */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
              SCAN HISTORY
            </h2>
            <span className="text-xs text-slate-400 font-medium">Recent items</span>
          </div>

          <div className="flex-1 min-h-0 pt-3 space-y-2.5 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading shelf scans...</span>
              </div>
            ) : visibleScans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No verified scans recorded yet.
              </div>
            ) : (
              visibleScans.map((scan) => {
                return (
                  <div
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#eff6ff] text-[#3b82f6] border border-blue-100/60 flex items-center justify-center shrink-0">
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

                    <div className="shrink-0 ml-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
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

        {/* Right Column: NEEDS APPROVAL */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col h-auto lg:h-full min-h-0 overflow-visible lg:overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
              NEEDS APPROVAL
            </h2>
          </div>

          <div className="flex-1 min-h-0 pt-3 space-y-2.5 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                <span>Loading pending orders...</span>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders pending approval. All orders are up to date.
              </div>
            ) : (
              visibleOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 active:scale-[0.99] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#eef2ff] text-[#4f46e5] border border-indigo-100/60 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{order.id}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                        {order.supplier || order.supplier_name || 'Supplier'} · {order.items?.length ?? 0} items
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Widget: Ask Gemini */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => setIsGeminiOpen(true)}
          className="px-5 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-semibold text-xs sm:text-sm rounded-full border border-slate-200 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Ask Gemini</span>
        </button>
      </div>

      {/* Interactive Gemini AI Modal */}
      {isGeminiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-[#3F4168] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base">Gemini Shelf Assistant</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGeminiOpen(false)
                  setGeminiResponse(null)
                }}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {geminiResponse ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase">You asked</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{geminiResponse.question}</p>
                  </div>
                  <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Gemini Intelligence</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">{geminiResponse.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeminiResponse(null)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    ← Ask another question
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Ask Gemini to analyze live shelf gaps, inventory threshold warnings, or purchase orders.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAskGemini('Summarize current shelf gaps')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors text-left cursor-pointer"
                    >
                      Summarize shelf gaps
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskGemini('Which products are low on stock?')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors text-left cursor-pointer"
                    >
                      Low-stock warnings
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskGemini('Status of pending purchase orders')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors text-left cursor-pointer"
                    >
                      Pending PO review
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAskGemini()
                    }}
                    className="pt-2 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={geminiQuery}
                      onChange={(e) => setGeminiQuery(e.target.value)}
                      placeholder="Ask Gemini about store stock..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!geminiQuery.trim()}
                      className="px-4 py-2 bg-[#5956c6] hover:bg-[#4d4ab5] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Ask
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
