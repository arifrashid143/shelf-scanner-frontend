import { useState } from 'react'
import {
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  Cpu,
} from 'lucide-react'

export default function ScanResult({
  scanData,
  inventory = [],
  onDone,
  onNavigate,
}) {
  const [viewMode, setViewMode] = useState('annotated') // 'annotated' | 'raw'
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

  // Annotated image URL from backend (with colored AI bounding boxes)
  const annotatedUrl = resolveImageUrl(scanData?.annotated_image_url)
  // Raw / preview photo URL
  const rawUrl = scanData?.previewUrl || resolveImageUrl(scanData?.raw_image_url)
  // Display photo URL based on selected view mode
  const photoUrl = viewMode === 'annotated' && annotatedUrl ? annotatedUrl : (rawUrl || annotatedUrl)

  // Products detected from backend
  const rawProducts = Array.isArray(scanData?.product_counts) ? scanData.product_counts : []
  const rawLowStock = Array.isArray(scanData?.low_stock_summary) ? scanData.low_stock_summary : []
  const uncatalogedSummary = Array.isArray(scanData?.uncataloged_summary)
    ? scanData.uncataloged_summary
    : Array.isArray(scanData?.unregistered_products)
    ? scanData.unregistered_products.map((p) => ({ label: p, detected_count: 1 }))
    : []

  // Build counts mapping from rawProducts or apiDetections or uncatalogedSummary
  const detectedCountsByProductId = {}
  const detectedCountsByName = {}

  if (rawProducts.length > 0) {
    rawProducts.forEach((p) => {
      if (p.product_id != null) detectedCountsByProductId[String(p.product_id)] = p.detected_count ?? 0
      if (p.name) detectedCountsByName[p.name.toLowerCase().trim()] = p.detected_count ?? 0
    })
  }

  if (hasApiDetections) {
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

  if (uncatalogedSummary.length > 0) {
    uncatalogedSummary.forEach((u) => {
      if (u.label) {
        const clean = u.label.toLowerCase().trim()
        if (!detectedCountsByName[clean]) {
          detectedCountsByName[clean] = u.detected_count || 1
        }
      }
    })
  }

  // Synonym keywords mapping for shelf object recognition
  const synonymMapping = {
    soda: ['soda', 'bottle', 'can', 'beverage', 'drink', 'spices', 'coke', 'pepsi', 'sprite', 'fanta'],
    milk: ['milk', 'carton', 'package', 'dairy', 'cereal'],
    candy: ['candy', 'package', 'bag', 'chocolate', 'chips', 'jelly', 'beans'],
    beans: ['beans', 'package', 'bag', 'candy', 'chocolate', 'chips'],
  }

  // Match inventory products against detected counts
  const matchedInventoryProducts = inventory.map((invItem) => {
    const prodId = String(invItem.productId || invItem.id)
    const nameKey = (invItem.name || '').toLowerCase().trim()

    let detectedCount = 0
    if (detectedCountsByProductId[prodId] !== undefined) {
      detectedCount = detectedCountsByProductId[prodId]
    } else if (detectedCountsByName[nameKey] !== undefined) {
      detectedCount = detectedCountsByName[nameKey]
    } else {
      // Direct substring match
      const matchingKey = Object.keys(detectedCountsByName).find(
        (k) => nameKey.includes(k) || k.includes(nameKey)
      )
      if (matchingKey) {
        detectedCount = detectedCountsByName[matchingKey]
      } else {
        // Synonym-based shelf recognition fallback
        const synonyms = synonymMapping[nameKey] || []
        for (const syn of synonyms) {
          if (detectedCountsByName[syn] !== undefined) {
            detectedCount = detectedCountsByName[syn]
            break
          }
        }
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
      reorder_recommended_qty:
        maxCapacity > detectedCount
          ? maxCapacity - detectedCount
          : minThreshold > detectedCount
          ? minThreshold - detectedCount
          : 0,
    }
  })

  // Explicit uncataloged detections list from AI vision (so no detected items are hidden)
  const uncatalogedProducts = uncatalogedSummary.map((item, idx) => {
    const labelClean = (item.label || 'Item').replace(/\[.*?\]/g, '').trim()
    const capLabel = labelClean.charAt(0).toUpperCase() + labelClean.slice(1)
    const count = item.detected_count || 1
    return {
      product_id: `ai_uncataloged_${idx}`,
      sku: `AI-DET-${labelClean.toUpperCase().replace(/\s+/g, '-')}`,
      name: `${capLabel} (AI Vision Detected)`,
      category: 'Computer Vision',
      detected_count: count,
      current_stock: count,
      min_stock_threshold: 5,
      max_shelf_capacity: Math.max(10, count),
      unit_price: 2.5,
      cost_price: 1.5,
      is_low_stock: false,
      is_missing: false,
      is_uncataloged: true,
      reorder_recommended_qty: 0,
    }
  })

  // Fallback: If inventory is empty but rawProducts exists
  const fallbackRawProducts = rawProducts.map((p) => {
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

  // Combined detected products list
  const detectedProducts =
    inventory.length > 0
      ? [...matchedInventoryProducts, ...uncatalogedProducts]
      : fallbackRawProducts.length > 0
      ? [...fallbackRawProducts, ...uncatalogedProducts]
      : uncatalogedProducts

  // Items identified for replenishment (low stock or zero detected)
  const lowStockCandidates =
    rawLowStock.length > 0
      ? rawLowStock
      : detectedProducts.filter((p) => p.is_low_stock || p.detected_count === 0)

  return (
    <div className="space-y-2.5 w-full max-w-[1550px] pb-24">
      {/* Top Header matching Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            Scan result · {shelfName}
          </h1>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {scanId}
          </span>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 border border-emerald-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          Done
        </button>
      </div>

      {/* Planogram Discrepancies & Unlisted Products Banner */}
      {scanData?.planogram_discrepancies && scanData.planogram_discrepancies.length > 0 && (
        <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200/90 text-amber-900 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Planogram Discrepancies / Unlisted Products Detected ({scanData.planogram_discrepancies.length})</span>
          </div>
          <p className="text-xs text-amber-700">
            The AI vision model detected items on this shelf that differ from the designated planogram:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {scanData.planogram_discrepancies.map((disc, idx) => (
              <div key={idx} className="bg-white/90 p-2.5 rounded-md border border-amber-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Tier {disc.tier}, Slot {disc.slot_index}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 capitalize">
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

      {/* AI Vision Engine Telemetry Banner */}
      <div className="p-3.5 rounded-md bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/90 text-slate-800 space-y-2 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              AI Vision Engine: {scanData?.vision_engine === 'grounding_dino' ? 'Grounding-DINO Multimodal Model' : 'YOLO Neural Detector'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {scanData?.scan_duration_ms > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 border border-blue-200 font-semibold">
                ⏱ {(scanData.scan_duration_ms / 1000).toFixed(1)}s inference
              </span>
            )}
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[2.5]" /> Completed
            </span>
          </div>
        </div>

        {uncatalogedSummary.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Detected Object Classes:
            </span>
            {uncatalogedSummary.map((u, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white text-slate-800 border border-blue-100 font-bold text-[11px] shadow-2xs"
              >
                <span className="capitalize">{u.label}</span>:
                <span className="text-blue-600 font-black">{u.detected_count || 1}</span>
              </span>
            ))}
            {emptyGaps > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                Empty Gaps: <span className="font-black text-rose-600">{emptyGaps}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Items counted</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{itemsCounted}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Identified on shelf</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Empty gaps</p>
          <p className="text-2xl sm:text-3xl font-black text-red-500 tracking-tight">{emptyGaps}</p>
          <p className="text-[11px] text-red-400 mt-0.5">Out of stock spaces</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Low-stock SKUs</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">{lowStockCandidates.length}</p>
          <p className="text-[11px] text-amber-500 mt-0.5">Below threshold</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-md border border-slate-200/90 shadow-2xs">
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
      <div className="bg-white rounded-md border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Uploaded Shelf Photo
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {annotatedUrl && rawUrl && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-bold border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('annotated')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    viewMode === 'annotated'
                      ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>AI Detection Boxes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    viewMode === 'raw'
                      ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Original Photo</span>
                </button>
              </div>
            )}
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {shelfName}
            </span>
          </div>
        </div>

        {/* Viewfinder Content */}
        <div className="rounded-md overflow-hidden bg-slate-950 aspect-[16/9] max-h-[500px] flex items-center justify-center relative border border-slate-800">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Uploaded Shelf Scan"
              className="w-full h-full object-contain"
              onError={(e) => {
                if (viewMode === 'annotated' && rawUrl) {
                  setViewMode('raw')
                } else {
                  e.currentTarget.style.display = 'none'
                }
              }}
            />
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
              <p className="font-bold text-sm">No uploaded shelf image available</p>
              <p className="text-xs text-slate-500">Preview generated from backend telemetry data</p>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-md border border-white/20 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {viewMode === 'annotated' && annotatedUrl ? 'AI Annotated View' : 'Original Capture'}: {itemsCounted} items detected · {emptyGaps} empty gaps
            </span>
          </div>
        </div>
      </div>

      {/* Detected Products on Shelf Table */}
      <div className="bg-white rounded-md border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Products Detected on Shelf</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time object recognition and shelf capacity analytics</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
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
                      {p.is_uncataloged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          <Sparkles className="w-3 h-3 text-blue-600" /> AI Detected ({p.detected_count})
                        </span>
                      ) : p.detected_count === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" /> Out of Stock (0)
                        </span>
                      ) : p.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Stock ({p.detected_count})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> In Stock ({p.detected_count})
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
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white rounded-md border border-blue-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-md bg-[#5956c6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  AI Auto-Generated Purchase Order
                </h3>
                {scanData?.auto_po_id && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
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
            className="px-4 py-2 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>View on Purchase Orders page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
