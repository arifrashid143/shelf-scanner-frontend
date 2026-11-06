import {
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export default function ScanResultView({
  scanData,
  inventory = [],
  onDone,
  onNavigate,
}) {
  const scanId = scanData?.id || scanData?.scan_id || 'Scan'
  const shelfName = scanData?.shelf_id || scanData?.shelfName || 'Shelf Section 1'

  // Extract raw backend detections array if available
  const apiDetections = Array.isArray(scanData?.detections) ? scanData.detections : []
  const hasApiDetections = apiDetections.length > 0

  // Total detected items and empty gaps from real API response
  const itemsCounted =
    typeof scanData?.total_detected_count === 'number' && scanData.total_detected_count > 0
      ? scanData.total_detected_count
      : hasApiDetections
      ? apiDetections.filter((d) => !d.is_empty_gap).length
      : (scanData?.total_detected_count ?? 0)

  const emptyGaps =
    typeof scanData?.empty_gaps_count === 'number' && scanData.empty_gaps_count > 0
      ? scanData.empty_gaps_count
      : hasApiDetections
      ? apiDetections.filter((d) => d.is_empty_gap).length
      : (scanData?.empty_gaps_count ?? 0)

  // Average confidence score from detections
  const avgConfidence = hasApiDetections
    ? Math.round(
        (apiDetections.reduce((sum, d) => sum + (d.confidence != null ? d.confidence : 0), 0) /
          Math.max(1, apiDetections.length)) *
          100
      )
    : (scanData?.accuracy ?? scanData?.confidence ?? null)



  // Helper to resolve relative backend image URLs
  const resolveImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url
    }
    return `https://ai-vs-scanner-be.aiiotgeeks.tech${url.startsWith('/') ? '' : '/'}${url}`
  }

  // Photo URL (supports live camera blob preview or backend hosted image)
  const photoUrl =
    scanData?.previewUrl ||
    resolveImageUrl(scanData?.annotated_image_url) ||
    resolveImageUrl(scanData?.raw_image_url) ||
    null

  // Products detected from backend
  const rawProducts = Array.isArray(scanData?.product_counts) ? scanData.product_counts : []
  const rawLowStock = Array.isArray(scanData?.low_stock_summary) ? scanData.low_stock_summary : []

  // Build counts mapping from rawProducts or apiDetections
  const detectedCountsByProductId = {}
  const detectedCountsByName = {}

  if (rawProducts.length > 0) {
    rawProducts.forEach((p) => {
      if (p.product_id != null) detectedCountsByProductId[String(p.product_id)] = p.detected_count ?? 0
      if (p.name) detectedCountsByName[p.name.toLowerCase().trim()] = p.detected_count ?? 0
    })
  } else if (hasApiDetections) {
    apiDetections.forEach((d) => {
      if (d.is_empty_gap) return
      if (d.product_id != null) {
        const idStr = String(d.product_id)
        detectedCountsByProductId[idStr] = (detectedCountsByProductId[idStr] || 0) + 1
      }
      if (d.label) {
        const cleanLabel = d.label.replace(/\[.*?\]/g, '').toLowerCase().trim()
        detectedCountsByName[cleanLabel] = (detectedCountsByName[cleanLabel] || 0) + 1
      }
    })
  }

  // Combine product counts with inventory data for complete shelf-to-inventory audit
  const detectedProducts = inventory.length > 0
    ? inventory.map((invItem) => {
        const prodId = String(invItem.productId || invItem.id)
        const nameKey = (invItem.name || '').toLowerCase().trim()

        let detectedCount = 0
        if (detectedCountsByProductId[prodId] !== undefined) {
          detectedCount = detectedCountsByProductId[prodId]
        } else if (detectedCountsByName[nameKey] !== undefined) {
          detectedCount = detectedCountsByName[nameKey]
        } else {
          const matchingKey = Object.keys(detectedCountsByName).find(
            (k) => nameKey.includes(k) || k.includes(nameKey)
          )
          if (matchingKey) {
            detectedCount = detectedCountsByName[matchingKey]
          }
        }

        const minThreshold = invItem.minThreshold ?? invItem.min_stock_threshold ?? 0
        const maxCapacity = invItem.target ?? invItem.max_shelf_capacity ?? 0
        const isLow = minThreshold > 0 ? detectedCount < minThreshold : false
        const isMissing = detectedCount === 0

        return {
          product_id: invItem.productId || invItem.id,
          sku: invItem.sku || `SKU-${invItem.id}`,
          name: invItem.name,
          category: invItem.category || 'General',
          detected_count: detectedCount,
          current_stock: invItem.current !== undefined ? invItem.current : 0,
          min_stock_threshold: minThreshold,
          max_shelf_capacity: maxCapacity,
          unit_price: invItem.price || 0,
          cost_price: invItem.costPrice || (invItem.price ? invItem.price * 0.7 : 0),
          is_low_stock: isLow,
          is_missing: isMissing,
          reorder_recommended_qty: maxCapacity > detectedCount ? maxCapacity - detectedCount : (minThreshold > detectedCount ? minThreshold - detectedCount : 0),
        }
      })
    : rawProducts.length > 0
    ? rawProducts.map((p) => {
        const minThresh = p.min_stock_threshold ?? 0
        const maxCap = p.max_shelf_capacity ?? 0
        const detected = p.detected_count !== undefined ? p.detected_count : 0
        return {
          product_id: p.product_id,
          sku: p.sku || `SKU-${p.product_id}`,
          name: p.name || `Product #${p.product_id}`,
          category: p.category || 'General',
          detected_count: detected,
          current_stock: detected,
          min_stock_threshold: minThresh,
          max_shelf_capacity: maxCap,
          unit_price: p.unit_price || p.price || 0,
          cost_price: p.cost_price || (p.unit_price ? p.unit_price * 0.7 : 0),
          is_low_stock: p.is_low_stock || (minThresh > 0 && detected < minThresh),
          is_missing: detected === 0,
          reorder_recommended_qty: p.reorder_recommended_qty || (maxCap > detected ? maxCap - detected : 0),
        }
      })
    : []

  // Items identified for replenishment (low stock or zero detected)
  const lowStockCandidates =
    rawLowStock.length > 0
      ? rawLowStock
      : detectedProducts.filter((p) => p.is_low_stock || p.detected_count === 0)

  return (
    <div className="space-y-4 w-full max-w-[1550px] pb-24">
      {/* Top Header matching Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            Scan result · {shelfName}
          </h1>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {scanId}
          </span>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 border border-emerald-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          Done
        </button>
      </div>

      {/* Planogram Discrepancies & Unlisted Products Banner */}
      {scanData?.planogram_discrepancies && scanData.planogram_discrepancies.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Planogram Discrepancies / Unlisted Products Detected ({scanData.planogram_discrepancies.length})</span>
          </div>
          <p className="text-xs text-amber-700">
            The AI vision model detected items on this shelf that differ from the designated planogram:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {scanData.planogram_discrepancies.map((disc, idx) => (
              <div key={idx} className="bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Tier {disc.tier}, Slot {disc.slot_index}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 capitalize">
                    {disc.discrepancy_type?.replace(/_/g, ' ') || 'Misplaced'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Detected: <strong className="text-amber-800">{disc.detected_label || 'Unlisted Product'}</strong> · Expected: {disc.expected_product_name || disc.expected_sku || 'Empty Slot'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Items counted</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{itemsCounted}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Identified on shelf</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Empty gaps</p>
          <p className="text-3xl font-black text-red-500 tracking-tight">{emptyGaps}</p>
          <p className="text-[11px] text-red-400 mt-0.5">Out of stock spaces</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Low-stock SKUs</p>
          <p className="text-3xl font-black text-amber-600 tracking-tight">{lowStockCandidates.length}</p>
          <p className="text-[11px] text-amber-500 mt-0.5">Below threshold</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">AI Detection Status</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Verified
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {avgConfidence != null ? `Computer vision confidence ${avgConfidence}%` : 'Stock count verification complete'}
          </p>
        </div>
      </div>

      {/* Uploaded Shelf Photo Inspection Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Uploaded Shelf Photo
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {shelfName}
          </span>
        </div>

        {/* Viewfinder Content */}
          <div className="rounded-xl overflow-hidden bg-slate-950 aspect-[16/9] max-h-[460px] flex items-center justify-center relative border border-slate-800">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Uploaded Shelf Scan"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
                <p className="font-bold text-sm">No uploaded shelf image available</p>
                <p className="text-xs text-slate-500">Preview generated from backend telemetry data</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Processed: {itemsCounted} items detected · {emptyGaps} empty gaps</span>
            </div>
          </div>
      </div>

      {/* Detected Products on Shelf Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Products Detected on Shelf</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time object recognition and shelf capacity analytics</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {detectedProducts.length} Recognized SKUs
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[380px] -mx-5 sm:mx-0 px-5 sm:px-0 scrollbar-thin">
          <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
            <thead className="sticky top-0 bg-white z-10 shadow-2xs">
              <tr className="text-xs text-slate-400 font-medium border-b border-slate-100 bg-white">
                <th className="py-3 font-medium bg-white">Product / SKU</th>
                <th className="py-3 font-medium bg-white">Category</th>
                <th className="py-3 font-medium bg-white">Shelf Count</th>
                <th className="py-3 font-medium bg-white">Min Threshold</th>
                <th className="py-3 font-medium bg-white">Max Capacity</th>
                <th className="py-3 font-medium text-right bg-white">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detectedProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No products detected in this scan.
                  </td>
                </tr>
              ) : (
                detectedProducts.map((p) => (
                  <tr key={p.sku} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[11px] font-normal text-slate-400 font-mono">{p.sku}</div>
                    </td>
                    <td className="py-3 text-slate-600">{p.category}</td>
                    <td className="py-3 font-extrabold text-slate-900 text-sm">{p.detected_count}</td>
                    <td className="py-3 text-slate-500">{p.min_stock_threshold}</td>
                    <td className="py-3 text-slate-500">{p.max_shelf_capacity}</td>
                    <td className="py-3 text-right">
                      {p.detected_count === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> Out of Stock (0)
                        </span>
                      ) : p.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Auto-Generated Purchase Order Banner */}
      {(scanData?.auto_po_id || lowStockCandidates.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white rounded-2xl border border-blue-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  AI Auto-Generated Purchase Order
                </h3>
                {scanData?.auto_po_id && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    #{scanData.auto_po_id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {lowStockCandidates.length} low-stock item(s) detected during scan analysis. A draft purchase order has been generated automatically and sent to the Purchase Orders page for review and approval.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('orders')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>View on Purchase Orders page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
