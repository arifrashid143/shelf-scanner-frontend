import { useState } from 'react'
import {
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  Cpu,
  Maximize2,
  X,
  FileText,
  Printer,
  Clock,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

export default function ScanResult({
  scanData,
  isAdmin = true,
  inventory = [],
  onDone,
  onNavigate,
  onApprovePO,
  onSelectOrder,
}) {
  const [zoomedImage, setZoomedImage] = useState(null)
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

  // Products detected from backend
  const rawProducts = Array.isArray(scanData?.product_counts) ? scanData.product_counts : []
  const rawLowStock = Array.isArray(scanData?.low_stock_summary) ? scanData.low_stock_summary : []
  const uncatalogedSummary = Array.isArray(scanData?.uncataloged_summary)
    ? scanData.uncataloged_summary
    : Array.isArray(scanData?.unregistered_products)
    ? scanData.unregistered_products.map((p) => ({ label: p, detected_count: 1 }))
    : []

  // 1. Group individual detections from AI Detection API
  const detectionsByLabelOrId = {}

  if (hasApiDetections) {
    apiDetections.forEach((d) => {
      if (d.is_empty_gap) return

      const cleanLabel = (d.label || 'Detected Item').replace(/\[.*?\]/g, '').trim()
      const pId = d.product_id != null ? String(d.product_id) : null
      const key = pId ? `id_${pId}` : `label_${cleanLabel.toLowerCase()}`

      if (!detectionsByLabelOrId[key]) {
        detectionsByLabelOrId[key] = {
          product_id: pId,
          label: cleanLabel,
          count: 0,
          confidences: [],
        }
      }
      detectionsByLabelOrId[key].count += 1
      if (typeof d.confidence === 'number' && d.confidence > 0) {
        detectionsByLabelOrId[key].confidences.push(d.confidence)
      }
    })
  }

  // 2. Incorporate rawProducts (from scanData.product_counts or scanData.products)
  if (rawProducts.length > 0) {
    rawProducts.forEach((p) => {
      const count = p.detected_count ?? 0
      if (count <= 0) return // Only detected items!

      const pId = p.product_id != null ? String(p.product_id) : null
      const cleanName = (p.name || p.label || 'Item').replace(/\[.*?\]/g, '').trim()
      const key = pId ? `id_${pId}` : `label_${cleanName.toLowerCase()}`

      if (!detectionsByLabelOrId[key]) {
        detectionsByLabelOrId[key] = {
          product_id: pId,
          label: cleanName,
          sku: p.sku,
          category: p.category,
          count: count,
          confidences: [],
          is_low_stock: p.is_low_stock,
        }
      } else {
        detectionsByLabelOrId[key].count = Math.max(detectionsByLabelOrId[key].count, count)
        if (p.sku) detectionsByLabelOrId[key].sku = p.sku
        if (p.category) detectionsByLabelOrId[key].category = p.category
        if (p.is_low_stock !== undefined) detectionsByLabelOrId[key].is_low_stock = p.is_low_stock
      }

      if (typeof p.confidence === 'number') {
        detectionsByLabelOrId[key].confidences.push(p.confidence)
      } else if (Array.isArray(p.confidences)) {
        detectionsByLabelOrId[key].confidences.push(...p.confidences)
      }
    })
  }

  // 3. Incorporate uncataloged summary if not already present
  if (uncatalogedSummary.length > 0) {
    uncatalogedSummary.forEach((u) => {
      const count = u.detected_count || 1
      if (count <= 0) return
      const cleanLabel = (u.label || 'Object').replace(/\[.*?\]/g, '').trim()
      const key = `label_${cleanLabel.toLowerCase()}`

      if (!detectionsByLabelOrId[key]) {
        detectionsByLabelOrId[key] = {
          product_id: null,
          label: cleanLabel,
          count: count,
          confidences: typeof u.confidence === 'number' ? [u.confidence] : [],
          is_uncataloged: true,
        }
      } else {
        detectionsByLabelOrId[key].count = Math.max(detectionsByLabelOrId[key].count, count)
      }
    })
  }

  // Helper index for enriching detected items with store inventory metadata (SKU, formal category)
  const inventoryById = {}
  const inventoryByName = {}
  inventory.forEach((item) => {
    const id = item.productId || item.id
    if (id != null) inventoryById[String(id)] = item
    if (item.name) inventoryByName[item.name.toLowerCase().trim()] = item
  })

  // 4. Construct final detectedProducts array strictly from detected entries (count > 0)
  const detectedProducts = Object.values(detectionsByLabelOrId)
    .filter((entry) => entry.count > 0)
    .map((entry, idx) => {
      let matchedInv = null
      if (entry.product_id && inventoryById[entry.product_id]) {
        matchedInv = inventoryById[entry.product_id]
      } else if (inventoryByName[entry.label.toLowerCase()]) {
        matchedInv = inventoryByName[entry.label.toLowerCase()]
      } else {
        const found = Object.keys(inventoryByName).find((k) =>
          k.includes(entry.label.toLowerCase()) || entry.label.toLowerCase().includes(k)
        )
        if (found) matchedInv = inventoryByName[found]
      }

      const displayName = matchedInv?.name || entry.label
      const capName = displayName.charAt(0).toUpperCase() + displayName.slice(1)
      const sku =
        entry.sku ||
        matchedInv?.sku ||
        (entry.product_id ? `SKU-${entry.product_id}` : `AI-DET-${entry.label.toUpperCase().replace(/\s+/g, '-')}`)
      const category = entry.category || matchedInv?.category || (entry.is_uncataloged ? 'Computer Vision' : 'Detected Object')

      let avgConf = null
      if (entry.confidences.length > 0) {
        const sum = entry.confidences.reduce((a, b) => a + (b > 1 ? b / 100 : b), 0)
        avgConf = Math.round((sum / entry.confidences.length) * 100)
      } else if (avgConfidence != null) {
        avgConf = avgConfidence
      }

      return {
        id: entry.product_id || `det_${idx}`,
        product_id: entry.product_id,
        name: capName,
        sku: sku,
        category: category,
        detected_count: entry.count,
        confidence: avgConf,
        is_low_stock: !!entry.is_low_stock,
        is_uncataloged: !!entry.is_uncataloged || !matchedInv,
      }
    })

  if (detectedProducts.length === 0 && itemsCounted > 0) {
    detectedProducts.push({
      id: 'general_detection',
      name: 'Detected Shelf Items',
      sku: 'AI-SHELF-DETECTED',
      category: 'Computer Vision',
      detected_count: itemsCounted,
      confidence: avgConfidence,
      is_low_stock: false,
      is_uncataloged: true,
    })
  }

  // Items identified for replenishment (strictly from backend detection data)
  const lowStockCandidates =
    rawLowStock.length > 0
      ? rawLowStock
      : detectedProducts.filter((p) => p.is_low_stock)

  // --- Professional Purchase Order Management ---
  const initialPo = scanData?.purchase_order || (scanData?.auto_po_id ? {
    id: scanData.auto_po_id,
    status: 'Draft',
    supplier: 'Apex Direct Distribution Logistics',
    notes: `AI auto-generated Purchase Order from shelf scan ${scanId || ''}`,
  } : null)

  const [poStatus, setPoStatus] = useState(initialPo?.status || 'Draft')
  const [isApprovingPo, setIsApprovingPo] = useState(false)
  const [poError, setPoError] = useState('')

  // Resolve PO Line Items with fallback from lowStockCandidates if needed
  const poLineItems = (() => {
    if (Array.isArray(initialPo?.items) && initialPo.items.length > 0) {
      return initialPo.items.map((it, idx) => {
        const pId = it.product_id || it.id
        const matched = inventory.find((inv) => String(inv.productId || inv.id) === String(pId))
        const name = it.name || it.product_name || matched?.name || `Product #${pId || idx + 1}`
        const sku = it.sku || matched?.sku || (pId ? `SKU-${pId}` : `SKU-PO-${idx + 1}`)
        const category = it.category || matched?.category || 'General'
        const qty = it.quantity || it.qty || 1
        const unitPrice = it.unit_cost || it.unitPrice || it.unit_price || matched?.costPrice || (matched?.price ? matched.price * 0.7 : 45)
        const shelfCount = it.detected_count !== undefined ? it.detected_count : (matched?.current ?? 0)
        const minThreshold = it.min_stock_threshold !== undefined ? it.min_stock_threshold : (matched?.minThreshold ?? 5)

        return {
          id: pId || `po_item_${idx}`,
          product_id: pId,
          name,
          sku,
          category,
          shelf_count: shelfCount,
          min_threshold: minThreshold,
          qty,
          unit_price: Number(unitPrice),
          total: Number(unitPrice) * qty,
        }
      })
    }

    if (lowStockCandidates.length > 0) {
      return lowStockCandidates.map((cand, idx) => {
        const pId = cand.product_id || cand.id
        const matched = inventory.find((inv) => String(inv.productId || inv.id) === String(pId))
        const name = cand.name || cand.product_name || matched?.name || `Product #${pId || idx + 1}`
        const sku = cand.sku || matched?.sku || `SKU-${pId || idx + 1}`
        const category = cand.category || matched?.category || 'General'
        const currentCount = cand.detected_count !== undefined ? cand.detected_count : (cand.current_stock ?? 0)
        const minThresh = cand.min_stock_threshold ?? matched?.minThreshold ?? 5
        const maxCap = cand.max_shelf_capacity ?? matched?.target ?? 10
        const qty = cand.reorder_recommended_qty || Math.max(1, maxCap - currentCount)
        const unitPrice = cand.cost_price || cand.unit_price || matched?.costPrice || (matched?.price ? matched.price * 0.7 : 45)

        return {
          id: pId || `cand_${idx}`,
          product_id: pId,
          name,
          sku,
          category,
          shelf_count: currentCount,
          min_threshold: minThresh,
          qty,
          unit_price: Number(unitPrice),
          total: Number(unitPrice) * qty,
        }
      })
    }

    return []
  })()

  const poTotalQty = poLineItems.reduce((acc, it) => acc + (it.qty || 0), 0)
  const poTotalAmount = poLineItems.reduce((acc, it) => acc + (it.total || 0), 0)
  const poId = initialPo?.id || scanData?.auto_po_id || (poLineItems.length > 0 ? `PO-AUTO-${scanId || 'DRAFT'}` : null)

  const handleApprovePO = async () => {
    if (!isAdmin) {
      setPoError('Admin authorization required to approve purchase orders.')
      return
    }
    if (!poId) return

    setIsApprovingPo(true)
    setPoError('')
    try {
      if (onApprovePO) {
        await onApprovePO(poId)
      }
      setPoStatus('Approved')
    } catch (err) {
      setPoError(err.message || 'Failed to approve purchase order')
    } finally {
      setIsApprovingPo(false)
    }
  }

  const handleViewInOrders = () => {
    if (poId && onSelectOrder) {
      onSelectOrder({
        id: poId,
        status: poStatus,
        supplier: initialPo?.supplier || 'Apex Direct Distribution Logistics',
        created_at: initialPo?.created_at || new Date().toISOString(),
        items: poLineItems,
        total: poTotalAmount,
        notes: initialPo?.notes || `AI auto-generated Purchase Order from shelf scan ${scanId || ''}`,
      })
    }
    if (onNavigate) {
      onNavigate('orders')
    }
  }

  return (
    <div className="space-y-3 w-full max-w-[1550px] pb-24 text-slate-900 dark:text-slate-100">
      {/* Top Header matching Sidebar logo height */}
      <div className="flex items-center justify-between shrink-0 h-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            Scan result · {shelfName}
          </h1>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {scanId}
          </span>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          Done
        </button>
      </div>

      {/* Planogram Discrepancies & Unlisted Products Banner */}
      {scanData?.planogram_discrepancies && scanData.planogram_discrepancies.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Planogram Discrepancies / Unlisted Products Detected ({scanData.planogram_discrepancies.length})</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300/80">
            The AI vision model detected items on this shelf that differ from the designated planogram:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {scanData.planogram_discrepancies.map((disc, idx) => (
              <div key={idx} className="bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Tier {disc.tier}, Slot {disc.slot_index}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 capitalize">
                    {disc.discrepancy_type?.replace(/_/g, ' ') || 'Misplaced'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Detected: <strong className="text-amber-800 dark:text-amber-300">{disc.detected_label || 'Unlisted Product'}</strong> · Expected: {disc.expected_product_name || disc.expected_sku || 'Empty Slot'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Vision Engine Telemetry Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-blue-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-2 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              AI Vision Engine: {scanData?.vision_engine === 'grounding_dino' ? 'Grounding-DINO Multimodal Model' : 'YOLO Neural Detector'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {scanData?.scan_duration_ms > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-100/70 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
                ⏱ {(scanData.scan_duration_ms / 1000).toFixed(1)}s inference
              </span>
            )}
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[2.5]" /> Completed
            </span>
          </div>
        </div>

        {uncatalogedSummary.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Detected Object Classes:
            </span>
            {uncatalogedSummary.map((u, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-blue-100 dark:border-slate-700 font-bold text-[11px] shadow-2xs"
              >
                <span className="capitalize">{u.label}</span>:
                <span className="text-blue-600 dark:text-blue-400 font-black">{u.detected_count || 1}</span>
              </span>
            ))}
            {emptyGaps > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[11px]">
                Empty Gaps: <span className="font-black text-rose-600 dark:text-rose-400">{emptyGaps}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Items counted</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{itemsCounted}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Identified on shelf</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Empty gaps</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">{emptyGaps}</p>
          <p className="text-[11px] text-rose-400 mt-0.5">Out of stock spaces</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {lowStockCandidates.length > 0 ? 'Low-stock Items' : 'Detected SKUs'}
          </p>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight ${lowStockCandidates.length > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {lowStockCandidates.length > 0 ? lowStockCandidates.length : detectedProducts.length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {lowStockCandidates.length > 0 ? 'Below shelf threshold' : 'Identified on shelf'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">AI Detection Status</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Verified
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {avgConfidence != null ? `Computer vision confidence ${avgConfidence}%` : 'Stock count verification complete'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PARALLEL SHELF PHOTO INSPECTION: SHOW BOTH IMAGES PARALLELLY (NO OPTIONS)  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Shelf Image Inspection & Visual AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parallel side-by-side view: Original shelf capture and AI neural detection bounding boxes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700">
              {shelfName}
            </span>
          </div>
        </div>

        {/* 2-Column Parallel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Original Shelf Photo */}
          <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Original Shelf Photo
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Raw Capture
              </span>
            </div>

            <div className="relative bg-slate-950 aspect-[4/3] sm:aspect-[16/10] max-h-[460px] flex items-center justify-center overflow-hidden group">
              {rawUrl ? (
                <img
                  src={rawUrl}
                  alt="Original shelf capture"
                  className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                  onClick={() => setZoomedImage({ url: rawUrl, title: 'Original Shelf Photo' })}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-bold text-sm">Original photo unavailable</p>
                  <p className="text-xs text-slate-500">No raw camera capture found for this scan</p>
                </div>
              )}

              {rawUrl && (
                <button
                  type="button"
                  onClick={() => setZoomedImage({ url: rawUrl, title: 'Original Shelf Photo' })}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Expand image fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 pointer-events-none">
                <ImageIcon className="w-3 h-3 text-slate-400" />
                <span>Original Unedited Image</span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Detection & Bounding Boxes */}
          <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="px-3.5 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  AI Detection & Bounding Boxes
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                AI Vision
              </span>
            </div>

            <div className="relative bg-slate-950 aspect-[4/3] sm:aspect-[16/10] max-h-[460px] flex items-center justify-center overflow-hidden group">
              {annotatedUrl ? (
                <img
                  src={annotatedUrl}
                  alt="AI Annotated shelf detection"
                  className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                  onClick={() => setZoomedImage({ url: annotatedUrl, title: 'AI Detection & Bounding Boxes' })}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : rawUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={rawUrl}
                    alt="Shelf capture"
                    className="w-full h-full object-contain opacity-60"
                  />
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                    <p className="font-bold text-sm text-white">AI Annotation processing / overlay</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {itemsCounted} items detected. Annotated overlay image will render once backend completes bounding box generation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Sparkles className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-bold text-sm">No detection image available</p>
                  <p className="text-xs text-slate-500">AI detection telemetry received without image attachment</p>
                </div>
              )}

              {annotatedUrl && (
                <button
                  type="button"
                  onClick={() => setZoomedImage({ url: annotatedUrl, title: 'AI Detection & Bounding Boxes' })}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Expand image fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 pointer-events-none">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>
                  {itemsCounted} items detected · {emptyGaps} empty gaps
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Products on Shelf Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Products Detected on Shelf</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time object recognition from AI Detection API</p>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
            {detectedProducts.length} Detected Items
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[380px] -mx-5 sm:mx-0 px-5 sm:px-0 scrollbar-thin">
          <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
              <tr className="text-xs text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <th className="py-3 font-medium bg-white dark:bg-slate-900">Detected Product / Object</th>
                <th className="py-3 font-medium bg-white dark:bg-slate-900">Category / Type</th>
                <th className="py-3 font-medium text-center bg-white dark:bg-slate-900">Detected Quantity</th>
                <th className="py-3 font-medium text-center bg-white dark:bg-slate-900">AI Confidence</th>
                <th className="py-3 font-medium text-right bg-white dark:bg-slate-900">Detection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {detectedProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                    No products detected in this scan.
                  </td>
                </tr>
              ) : (
                detectedProducts.map((p) => (
                  <tr key={p.sku || p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      <div>{p.name}</div>
                      <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 font-mono">{p.sku}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 font-extrabold text-slate-900 dark:text-white text-sm text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/50 dark:border-indigo-800/50">
                        {p.detected_count}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {p.confidence != null ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                          {p.confidence}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {p.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Low Stock ({p.detected_count})
                        </span>
                      ) : p.is_uncataloged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" /> AI Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> AI Verified
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

      {/* ========================================================================= */}
      {/* PROFESSIONAL AI AUTO-GENERATED PURCHASE ORDER SPECIFICATION               */}
      {/* ========================================================================= */}
      {(poId || poLineItems.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100 transition-all">
          {/* Top Document Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30 border border-indigo-400/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    Official Purchase Order
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-white">
                    #{poId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      poStatus === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {poStatus === 'Approved' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Approved & Dispatched
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Draft · Pending Review
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                  <span>Source: <strong>{shelfName}</strong> AI Vision Scan</span>
                  <span>·</span>
                  <span className="text-indigo-300 font-medium">Automated Shelf Replenishment</span>
                </p>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs border border-white/10"
                title="Print Purchase Order"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Print PO</span>
              </button>

              <button
                type="button"
                onClick={handleViewInOrders}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/30 border border-indigo-400/30"
              >
                <span>View in Orders Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PO Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                SKUs to Restock
              </span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {poLineItems.length} Products
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Identified by vision AI</p>
            </div>

            <div className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                Total Restock Units
              </span>
              <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {poTotalQty} Units
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Recommended replenishment</p>
            </div>

            <div className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                Estimated Order Value
              </span>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{Math.round(poTotalAmount).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Wholesale supplier estimate</p>
            </div>

            <div className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                Assigned Supplier
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {initialPo?.supplier || 'Apex Direct Distribution Logistics'}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Fast-track Net 30
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Itemized Restock Schedule
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Calculated deficit based on target capacity threshold minus identified shelf stock
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                {poLineItems.length} Line Items
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs sm:text-sm min-w-[620px]">
                <thead>
                  <tr className="text-[11px] text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">Product / SKU</th>
                    <th className="py-2.5 font-semibold">Category</th>
                    <th className="py-2.5 font-semibold text-center">Detected Stock</th>
                    <th className="py-2.5 font-semibold text-center">Min Threshold</th>
                    <th className="py-2.5 font-semibold text-center">Order Qty</th>
                    <th className="py-2.5 font-semibold text-right">Unit Cost</th>
                    <th className="py-2.5 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {poLineItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-slate-400 text-xs">
                        No replenishment items required for this scan.
                      </td>
                    </tr>
                  ) : (
                    poLineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">
                          <div>{item.name}</div>
                          <div className="text-[11px] font-normal text-slate-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-800/40 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            {item.shelf_count} units
                          </span>
                        </td>
                        <td className="py-3 text-center text-slate-500 font-medium">
                          {item.min_threshold} units
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center justify-center font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm">
                            +{item.qty} units
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{item.unit_price.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Financial Summary Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    AI Auto-PO Policy: Automated Reorder Verification
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl">
                  Generated automatically based on shelf capacity deficit. Admin review and one-click dispatch are enabled directly from this report.
                </p>
                {poError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{poError}</p>
                )}
              </div>

              <div className="flex flex-col sm:items-end gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Subtotal ({poTotalQty} units):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{Math.round(poTotalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Freight & Logistics:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Included (Direct)</span>
                </div>
                <div className="flex items-center gap-4 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total PO Value:</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    ₹{Math.round(poTotalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin One-Click Action Controls */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {poStatus === 'Approved' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    PO Approved & Inventory Replenishment Synced
                  </span>
                ) : isAdmin ? (
                  <button
                    type="button"
                    onClick={handleApprovePO}
                    disabled={isApprovingPo}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isApprovingPo ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>One-Click Approve & Dispatch PO</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Store Admin approval required to dispatch this PO</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleViewInOrders}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Manage on Purchase Orders page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Modal for Zooming Either Image */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                {zoomedImage.title}
              </span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex-1 flex items-center justify-center overflow-auto bg-slate-950">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
