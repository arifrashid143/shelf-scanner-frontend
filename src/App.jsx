import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { api } from './api/client'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import LoginView from './views/LoginView'
import AdminDashboardView from './views/AdminDashboardView'
import UserDashboardView from './views/UserDashboardView'
import NewScanView from './views/NewScanView'
import ScanResultView from './views/ScanResultView'
import OrdersView from './views/OrdersView'
import OrderDetailView from './views/OrderDetailView'
import InventoryView from './views/InventoryView'
import UserManagementView from './views/UserManagementView'
import SuperAdminView from './views/SuperAdminView'
import logoImg from './assets/logo.png'
import { Loader2, LogOut, Menu } from 'lucide-react'

function normalizeOrder(order) {
  if (!order) return null
  const rawStatus = (order.status || 'Draft').toUpperCase()
  let formattedStatus = 'Draft'
  if (rawStatus === 'APPROVED') formattedStatus = 'Approved'
  else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED') formattedStatus = 'Rejected'

  const rawDate = order.created_at || order.createdAt || order.date || null
  let parsedTime = Date.now()
  if (rawDate) {
    const t = new Date(rawDate).getTime()
    if (!isNaN(t)) parsedTime = t
  }

  return {
    id: String(order.id),
    supplier: order.supplier_name || order.supplier || 'Primary Supplier',
    date: rawDate && !isNaN(new Date(rawDate).getTime())
      ? new Date(rawDate).toLocaleDateString()
      : (order.date || 'Today'),
    createdAt: parsedTime,
    rawCreatedAt: rawDate,
    total: typeof order.total_cost === 'number'
      ? order.total_cost
      : typeof order.total === 'number'
      ? order.total
      : 0,
    status: formattedStatus,
    items: Array.isArray(order.items) ? order.items : [],
    notes: order.notes || '',
  }
}

function sortOrdersNewestFirst(ordersList) {
  if (!Array.isArray(ordersList)) return []
  return [...ordersList].sort((a, b) => {
    const timeA = a?.createdAt || 0
    const timeB = b?.createdAt || 0
    if (timeB !== timeA) return timeB - timeA
    return String(b?.id || '').localeCompare(String(a?.id || ''), undefined, { numeric: true })
  })
}

function MainApp() {
  const { user, isSuperAdmin, isAdmin, isAuthenticated, loading: authLoading, logout } = useAuth()

  const displayName =
    user?.full_name || user?.name || (isSuperAdmin ? 'Superadmin' : isAdmin ? 'Store Admin' : 'Store Associate')
  const tenantName =
    user?.tenant_name ||
    user?.tenant?.name ||
    user?.store_name ||
    user?.company_name ||
    'Apex Retail'
  const initial = displayName.charAt(0).toUpperCase() || 'P'

  // Consistent neutral background matching dashboard theme
  const getPageBg = () => 'bg-[#f8f9fa]'

  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentScan, setCurrentScan] = useState(null)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [recentScans, setRecentScans] = useState([])
  const [totalScansCount, setTotalScansCount] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('shelf_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const profileMenuRef = useRef(null)

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('shelf_sidebar_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Refresh live inventory from backend API
  const refreshInventory = async () => {
    try {
      const invData = await api.getInventory().catch(() => null)
      if (invData?.items || invData?.inventory) {
        const rawItems = invData.items || invData.inventory
        const normalized = rawItems.map((item) => ({
          id: String(item.id || item.sku),
          productId: item.id,
          sku: item.sku || `SKU-${item.id}`,
          name: item.name,
          category: item.category || 'General',
          current: item.current_stock !== undefined ? item.current_stock : (item.current || 0),
          target: item.max_shelf_capacity || item.min_stock_threshold || item.target || 0,
          minThreshold: item.min_stock_threshold || 0,
          price: item.unit_price || item.price || 0,
          costPrice: item.cost_price || 0,
          status: item.is_low_stock || item.stock_status === 'low_stock' || item.status === 'Low' ? 'Low' : 'OK',
          history: item.history || [],
        }))
        setInventory(normalized)
      }
    } catch (err) {
      console.error('Failed to refresh inventory:', err)
    }
  }

  // Refresh live purchase orders from backend API (sorted newest first)
  const refreshOrders = async () => {
    try {
      const ordersData = await api.getOrders().catch(() => null)
      if (ordersData) {
        const rawOrders = Array.isArray(ordersData)
          ? ordersData
          : ordersData.purchaseOrders || (ordersData.id ? [ordersData] : [])
        const normalized = rawOrders.map(normalizeOrder).filter(Boolean)
        setPurchaseOrders((prev) => {
          const combined = [...normalized]
          prev.forEach((p) => {
            if (!combined.some((c) => String(c.id) === String(p.id))) {
              combined.push(p)
            }
          })
          return sortOrdersNewestFirst(combined)
        })
      }
    } catch (err) {
      console.error('Failed to refresh purchase orders:', err)
    }
  }

  // Fetch real data from backend API when authenticated (for Store Admin and Staff)
  const loadData = async () => {
    if (isSuperAdmin) return

    setDataLoading(true)
    setDataError(null)
    try {
      const [invData, ordersData, scansData] = await Promise.all([
        api.getInventory().catch(() => null),
        api.getOrders().catch(() => null),
        api.getScans({ limit: 100 }).catch(() => null),
      ])

      if (invData?.items || invData?.inventory) {
        const rawItems = invData.items || invData.inventory
        const normalized = rawItems.map((item) => ({
          id: String(item.id || item.sku),
          productId: item.id,
          sku: item.sku || `SKU-${item.id}`,
          name: item.name,
          category: item.category || 'General',
          current: item.current_stock !== undefined ? item.current_stock : (item.current || 0),
          target: item.max_shelf_capacity || item.min_stock_threshold || item.target || 0,
          minThreshold: item.min_stock_threshold || 0,
          price: item.unit_price || item.price || 0,
          costPrice: item.cost_price || 0,
          status: item.is_low_stock || item.stock_status === 'low_stock' || item.status === 'Low' ? 'Low' : 'OK',
          history: item.history || [],
        }))
        setInventory(normalized)
      }

      if (ordersData) {
        const rawOrders = Array.isArray(ordersData)
          ? ordersData
          : ordersData.purchaseOrders || (ordersData.id ? [ordersData] : [])
        if (rawOrders.length > 0) {
          const normalizedOrders = sortOrdersNewestFirst(
            rawOrders.map(normalizeOrder).filter(Boolean)
          )
          setPurchaseOrders(normalizedOrders)
          setSelectedOrder(normalizedOrders[0] || null)
        }
      }

      if (scansData) {
        const rawScans = scansData.items || scansData.recentScans
        if (Array.isArray(rawScans) && rawScans.length > 0) {
          // Only show scans after they are successfully verified / completed
          const verifiedScans = rawScans.filter((s) => {
            const st = (s.status || '').toLowerCase()
            return (
              st === 'completed' ||
              st === 'done' ||
              st === 'verified' ||
              (Number(s.total_detected_count) > 0 && st !== 'pending' && st !== 'processing')
            )
          })

          setTotalScansCount(verifiedScans.length)

          const normalizedScans = verifiedScans.map((s) => ({
            id: s.id,
            shelf: s.shelf_id ? s.shelf_id.replace(/_/g, ' ') : 'General Shelf',
            shelf_id: s.shelf_id,
            time: s.created_at
              ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
            gaps: s.empty_gaps_count ?? 0,
            empty_gaps_count: s.empty_gaps_count ?? 0,
            items: s.total_detected_count ?? 0,
            total_detected_count: s.total_detected_count ?? 0,
            status: 'Verified',
            raw_image_url: s.raw_image_url,
            annotated_image_url: s.annotated_image_url,
          }))
          setRecentScans(normalizedScans)
        }
      }
    } catch (err) {
      console.error('Error fetching initial API data:', err)
      setDataError(err.message || 'Failed to connect to backend APIs.')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && currentTab === 'orders') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshOrders()
    }
  }, [isAuthenticated, currentTab])

  // --- Purchase Order Actions with Backend Enforcement ---

  const handleGeneratePO = async (customPayload = null) => {
    try {
      showToast('Generating purchase order in backend...', 'info')
      let payload = {
        scan_id: currentScan?.id || currentScan?.scan_id || null,
        supplier_id: 1,
        notes: 'Auto-generated draft purchase order from visual shelf scan',
      }
      if (customPayload && typeof customPayload === 'object') {
        payload = { ...payload, ...customPayload }
      }

      let res
      try {
        res = await api.generateOrder(payload)
      } catch {
        res = await api.generateOrder({ scan_id: payload.scan_id })
      }

      // Refresh orders list from backend and place newly generated PO at the top
      const ordersData = await api.getOrders().catch(() => null)
      let allOrders = []
      if (ordersData) {
        const rawOrders = Array.isArray(ordersData)
          ? ordersData
          : ordersData.purchaseOrders || (ordersData.id ? [ordersData] : [])
        allOrders = rawOrders.map(normalizeOrder).filter(Boolean)
      }

      if (res?.id) {
        const existingIdx = allOrders.findIndex((o) => String(o.id) === String(res.id))
        const normalizedNew = normalizeOrder({
          ...res,
          status: res.status || 'Draft',
          created_at: res.created_at || new Date().toISOString(),
        })
        if (existingIdx >= 0) {
          allOrders[existingIdx] = { ...allOrders[existingIdx], ...normalizedNew }
        } else {
          allOrders.unshift(normalizedNew)
        }
      }

      const sortedOrders = sortOrdersNewestFirst(allOrders)
      if (res?.id) {
        const idx = sortedOrders.findIndex((o) => String(o.id) === String(res.id))
        if (idx > 0) {
          const [poToTop] = sortedOrders.splice(idx, 1)
          sortedOrders.unshift(poToTop)
        }
      }

      setPurchaseOrders(sortedOrders)
      const target = (res?.id ? sortedOrders.find((o) => String(o.id) === String(res.id)) : null) || sortedOrders[0]
      setSelectedOrder(target)

      setCurrentTab('orders')
      showToast(
        `Draft order ${res?.id || ''} created! ${
          isAdmin ? 'Ready for approval.' : 'Submitted for Store Admin approval.'
        }`,
        'success'
      )
    } catch (err) {
      showToast(err.message || 'Failed to generate order', 'error')
    }
  }

  const handleApprovePO = async (orderId) => {
    try {
      await api.approveOrder(orderId, {
        approved_by: user?.full_name || user?.name || 'Platform Superadmin',
        notes: 'Approved via shelf scanner auto-reorder agent',
      })
      setPurchaseOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'Approved' } : o))
      )
      await refreshInventory()
      showToast(`Order ${orderId} Approved & Inventory restocked!`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to approve order (Requires Admin)', 'error')
      throw err
    }
  }

  const handleRejectPO = async (orderId) => {
    try {
      await api.cancelOrder(orderId)
      setPurchaseOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'Rejected' } : o))
      )
      showToast(`Order ${orderId} Rejected`, 'info')
    } catch (err) {
      showToast(err.message || 'Failed to reject order (Requires Admin)', 'error')
      throw err
    }
  }

  // --- Inventory Actions with Backend Enforcement (Admin Only) ---

  const handleUpdateProduct = async (updateData) => {
    try {
      const prodId = updateData.productId || updateData.id
      await api.updateProduct(prodId, {
        current_stock: updateData.current,
        max_shelf_capacity: updateData.target,
      })
      await refreshInventory()
      showToast('Inventory updated successfully in backend', 'success')
    } catch (err) {
      showToast(err.message || 'Access Denied: Only Admin can update inventory', 'error')
      throw err
    }
  }

  const handleAddProduct = async (productData) => {
    try {
      const price = parseFloat(productData.price || 0)
      const target = parseInt(productData.target || 0, 10)
      const current = parseInt(productData.current || 0, 10)
      const minThreshold = productData.minThreshold ? parseInt(productData.minThreshold, 10) : Math.max(1, Math.round(target * 0.25))

      await api.createProduct({
        name: productData.name,
        category: productData.category || 'General',
        sku: productData.sku || `SKU-${Date.now()}`,
        current_stock: current,
        min_stock_threshold: minThreshold,
        max_shelf_capacity: target,
        unit_price: price,
        cost_price: productData.costPrice || (price ? price * 0.7 : 0),
      })
      await refreshInventory()
      showToast(`Product "${productData.name}" added to inventory`, 'success')
    } catch (err) {
      showToast(err.message || 'Access Denied: Only Admin can add products', 'error')
      throw err
    }
  }

  // --- Shelf Scan Completion with POST /api/scans and GET /api/scans/{scan_id} ---
  const handleScanComplete = async (scanData) => {
    try {
      showToast('Uploading shelf scan to AI engine...', 'info')
      const res = await api.uploadScan(scanData.file, {
        shelf_id: scanData.shelfName || 'Shelf Section 1',
        store_id: user?.store_id || 'store_main',
        sync_mode: true,
      })

      let fullScan = { ...res, previewUrl: scanData.previewUrl }
      if (res?.id) {
        try {
          // If scan is still pending, poll briefly until verified
          let attempts = 0
          while (
            attempts < 5 &&
            (fullScan.status?.toLowerCase() === 'pending' || fullScan.status?.toLowerCase() === 'processing')
          ) {
            attempts++
            await new Promise((resolve) => setTimeout(resolve, 1200))
            const check = await api.getScanById(res.id).catch(() => null)
            if (check) {
              fullScan = { ...fullScan, ...check }
              if (check.status?.toLowerCase() === 'completed' || check.status?.toLowerCase() === 'done') {
                break
              }
            }
          }

          const [detail, detections] = await Promise.all([
            api.getScanById(res.id).catch(() => null),
            api.getScanDetections(res.id).catch(() => null),
          ])
          fullScan = {
            ...fullScan,
            ...(detail || {}),
            ...(detections || {}),
          }
        } catch (e) {
          console.warn('Scan detail fetch fallback:', e.message)
        }
      }

      setCurrentScan(fullScan)

      // Only show the scan in history after it successfully gets verified
      const isVerified =
        fullScan.status?.toLowerCase() === 'completed' ||
        fullScan.status?.toLowerCase() === 'done' ||
        fullScan.status?.toLowerCase() === 'verified' ||
        (Number(fullScan.total_detected_count) > 0)

      if (isVerified) {
        setRecentScans((prev) => [
          {
            id: fullScan.id || `scn_${Date.now()}`,
            date: fullScan.created_at ? new Date(fullScan.created_at).toLocaleDateString() : 'Just now',
            shelf: fullScan.shelf_id || scanData.shelfName || 'Shelf Section 1',
            time: fullScan.created_at
              ? new Date(fullScan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            items: typeof fullScan.total_detected_count === 'number' ? fullScan.total_detected_count : 0,
            gaps: typeof fullScan.empty_gaps_count === 'number' ? fullScan.empty_gaps_count : 0,
            accuracy: fullScan.accuracy ?? fullScan.confidence ?? null,
            status: 'Verified',
            raw_image_url: fullScan.raw_image_url,
            annotated_image_url: fullScan.annotated_image_url,
          },
          ...prev.filter((p) => p.id !== fullScan.id),
        ])
        setTotalScansCount((prev) => (prev || 0) + 1)
      }

      // Automatically generate purchase order using AI based on analyzed image data
      try {
        const scanId = fullScan.id || fullScan.scan_id || res?.id || null
        const existingDraftPoId = fullScan.draft_purchase_order_id || null

        const detectedCountsByProductId = {}
        const detectedCountsByName = {}

        const rawDetections = Array.isArray(fullScan?.detections) ? fullScan.detections : []
        rawDetections.forEach((d) => {
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

        const rawProductCounts = Array.isArray(fullScan?.product_counts)
          ? fullScan.product_counts
          : Array.isArray(fullScan?.products)
          ? fullScan.products
          : []
        if (rawProductCounts.length > 0) {
          rawProductCounts.forEach((p) => {
            if (p.product_id != null) {
              detectedCountsByProductId[String(p.product_id)] = p.detected_count ?? 0
            }
            if (p.name) {
              detectedCountsByName[p.name.toLowerCase().trim()] = p.detected_count ?? 0
            }
          })
        }

        const itemsToReorder = []

        // 1. Prioritize low_stock_summary provided directly by AI vision engine
        const lowStockSummary = Array.isArray(fullScan?.low_stock_summary)
          ? fullScan.low_stock_summary
          : []
        if (lowStockSummary.length > 0) {
          lowStockSummary.forEach((item) => {
            if (item.product_id != null) {
              const pId = parseInt(item.product_id, 10)
              if (!isNaN(pId)) {
                const qty =
                  item.reorder_recommended_qty ||
                  Math.max(1, (item.max_shelf_capacity || 10) - (item.detected_count || 0))
                itemsToReorder.push({
                  product_id: pId,
                  quantity: qty,
                  unit_cost: item.cost_price != null ? Number(item.cost_price) : null,
                  recommended_reason: `AI detected ${item.detected_count ?? 0} on shelf (min threshold ${item.min_stock_threshold ?? 5})`,
                })
              }
            }
          })
        }

        // 2. Fallback: match inventory products against detected counts
        if (itemsToReorder.length === 0 && inventory.length > 0) {
          inventory.forEach((invItem) => {
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

            const minThreshold = invItem.minThreshold ?? invItem.min_stock_threshold ?? 5
            const maxCapacity = invItem.target ?? invItem.max_shelf_capacity ?? 10

            if (detectedCount < minThreshold || detectedCount === 0) {
              const reorderQty =
                maxCapacity > detectedCount
                  ? maxCapacity - detectedCount
                  : Math.max(1, minThreshold - detectedCount)

              const pId = parseInt(invItem.productId || invItem.id, 10)
              if (!isNaN(pId)) {
                itemsToReorder.push({
                  product_id: pId,
                  quantity: reorderQty,
                  unit_cost: invItem.costPrice || (invItem.price ? invItem.price * 0.7 : null),
                  recommended_reason: `AI detected ${detectedCount} on shelf (below threshold ${minThreshold})`,
                })
              }
            }
          })
        } else if (itemsToReorder.length === 0 && rawProductCounts.length > 0) {
          rawProductCounts.forEach((p) => {
            const minThresh = p.min_stock_threshold ?? 5
            const maxCap = p.max_shelf_capacity ?? 10
            const detected = p.detected_count ?? 0
            if (detected < minThresh || detected === 0) {
              const reorderQty = maxCap > detected ? maxCap - detected : Math.max(1, minThresh - detected)
              const pId = parseInt(p.product_id, 10)
              if (!isNaN(pId)) {
                itemsToReorder.push({
                  product_id: pId,
                  quantity: reorderQty,
                  unit_cost: p.cost_price || (p.unit_price ? p.unit_price * 0.7 : null),
                  recommended_reason: `AI detected ${detected} on shelf`,
                })
              }
            }
          })
        }

        let autoPoResponse = null
        if (existingDraftPoId) {
          autoPoResponse = { id: existingDraftPoId }
        } else if (itemsToReorder.length > 0 || scanId) {
          try {
            if (itemsToReorder.length > 0) {
              try {
                autoPoResponse = await api.generateOrder({
                  scan_id: scanId,
                  items: itemsToReorder,
                  notes: `AI auto-generated Purchase Order for ${itemsToReorder.length} low-stock item(s) from shelf scan ${scanId || ''}`,
                })
              } catch (withItemsErr) {
                console.warn('Draft PO with items error, trying scan_id only:', withItemsErr.message)
                autoPoResponse = await api.generateOrder({
                  scan_id: scanId,
                  notes: `AI auto-generated Purchase Order from shelf scan ${scanId || ''}`,
                }).catch(() => null)
              }
            } else if (scanId) {
              autoPoResponse = await api.generateOrder({
                scan_id: scanId,
                notes: `AI auto-generated Purchase Order from shelf scan ${scanId || ''}`,
              }).catch(() => null)
            }
          } catch (autoErr) {
            console.warn('AI draft PO generation error:', autoErr.message)
          }
        }

        if (autoPoResponse?.id) {
          fullScan.auto_po_id = autoPoResponse.id
          fullScan.auto_po_items_count = itemsToReorder.length
        }

        // Fetch refreshed orders list from backend
        const freshOrdersData = await api.getOrders().catch(() => null)
        let allOrders = []
        if (freshOrdersData) {
          const rawOrders = Array.isArray(freshOrdersData)
            ? freshOrdersData
            : freshOrdersData.purchaseOrders || (freshOrdersData.id ? [freshOrdersData] : [])
          allOrders = rawOrders.map(normalizeOrder).filter(Boolean)
        }

        // If autoPoResponse was created, ensure it exists in orders list
        if (autoPoResponse?.id) {
          const existingIdx = allOrders.findIndex((o) => String(o.id) === String(autoPoResponse.id))
          const normalizedNew = normalizeOrder({
            ...autoPoResponse,
            status: autoPoResponse.status || 'Draft',
            created_at: autoPoResponse.created_at || new Date().toISOString(),
            items: autoPoResponse.items || itemsToReorder,
            notes: autoPoResponse.notes || `AI auto-generated Purchase Order from shelf scan ${scanId || ''}`,
          })

          if (existingIdx >= 0) {
            allOrders[existingIdx] = { ...allOrders[existingIdx], ...normalizedNew }
          } else {
            allOrders.unshift(normalizedNew)
          }
        }

        // Sort orders strictly newest first
        const sortedOrders = sortOrdersNewestFirst(allOrders)

        // Ensure the newly generated PO is placed at the very top (index 0) of the PO table
        if (autoPoResponse?.id) {
          const targetIdx = sortedOrders.findIndex((o) => String(o.id) === String(autoPoResponse.id))
          if (targetIdx > 0) {
            const [poToTop] = sortedOrders.splice(targetIdx, 1)
            sortedOrders.unshift(poToTop)
          }
        }

        setPurchaseOrders(sortedOrders)
        if (sortedOrders.length > 0) {
          setSelectedOrder(sortedOrders[0])
        }
      } catch (autoPoErr) {
        console.warn('AI auto purchase order generation fallback:', autoPoErr.message)
      }

      setCurrentScan(fullScan)

      if (fullScan.auto_po_id) {
        showToast(
          `Scan processed! AI auto-generated Purchase Order #${fullScan.auto_po_id} for ${fullScan.auto_po_items_count} low-stock item(s). Displayed on Purchase Orders page!`,
          'success'
        )
      } else {
        showToast(
          `Scan ${fullScan.id || ''} processed! Detected: ${fullScan.total_detected_count ?? 0} items, ${fullScan.empty_gaps_count ?? 0} empty gaps.`,
          'success'
        )
      }

      setCurrentTab('scan-result')
    } catch (err) {
      console.error('Scan API error:', err)
      showToast(err.message || 'Failed to upload shelf scan to backend API.', 'error')
    }
  }

  const handleSelectScan = async (scan) => {
    if (scan?.id && scan.id.startsWith('scn_')) {
      try {
        const [detail, detections] = await Promise.all([
          api.getScanById(scan.id).catch(() => null),
          api.getScanDetections(scan.id).catch(() => null),
        ])
        setCurrentScan({
          ...scan,
          ...(detail || {}),
          ...(detections || {}),
        })
      } catch (err) {
        console.warn('Failed to fetch scan by ID:', err.message)
        setCurrentScan(scan)
      }
    } else {
      setCurrentScan(scan)
    }
    setCurrentTab('scan-result')
  }

  const handleSelectOrder = async (order) => {
    if (order?.id) {
      try {
        const fullOrder = await api.getOrderById(order.id)
        if (fullOrder) {
          const rawStatus = (fullOrder.status || 'Draft').toUpperCase()
          let formattedStatus = 'Draft'
          if (rawStatus === 'APPROVED') formattedStatus = 'Approved'
          else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED') formattedStatus = 'Rejected'

          setSelectedOrder({
            id: fullOrder.id,
            supplier: fullOrder.supplier_name || fullOrder.supplier || order.supplier || 'N/A',
            date: fullOrder.created_at ? new Date(fullOrder.created_at).toLocaleDateString() : (fullOrder.date || order.date || ''),
            total: typeof fullOrder.total_cost === 'number' ? fullOrder.total_cost : (fullOrder.total || order.total || 0),
            status: formattedStatus,
            items: Array.isArray(fullOrder.items) && fullOrder.items.length > 0
              ? fullOrder.items.map((it) => ({
                  id: it.id || it.product_id,
                  name: it.product_name || it.name,
                  stock: it.detected_stock ?? it.stock ?? '-',
                  target: it.threshold ?? it.target ?? '-',
                  qty: it.quantity ?? it.qty ?? 0,
                  unitPrice: it.unit_cost ?? it.unitPrice ?? 0,
                }))
              : (Array.isArray(order.items) ? order.items : []),
            notes: fullOrder.notes || order.notes || '',
            scanSource: fullOrder.scan_id || fullOrder.shelf_id || order.scanSource || 'Shelf Scan',
          })
          setCurrentTab('order-detail')
          return
        }
      } catch (err) {
        console.warn('Failed to fetch order detail by ID:', err.message)
      }
    }
    setSelectedOrder(order)
    setCurrentTab('order-detail')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-semibold">Checking role authorization…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginView />
  }

  // Superadmin Single-Page Management (NO sidebar, NO store data, NO tabs)
  if (isSuperAdmin) {
    return <SuperAdminView user={user} onLogout={logout} />
  }

  // Render view depending on user role and selected tab
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return isAdmin ? (
          <AdminDashboardView
            user={user}
            onNavigate={setCurrentTab}
            onSelectOrder={handleSelectOrder}
            onSelectScan={handleSelectScan}
            purchaseOrders={purchaseOrders}
            recentScans={recentScans}
            inventory={inventory}
            totalScansCount={totalScansCount}
            isLoading={dataLoading}
            onQuickApproveOrder={handleApprovePO}
          />
        ) : (
          <UserDashboardView
            user={user}
            onNavigate={setCurrentTab}
            onSelectScan={handleSelectScan}
            onGenerateOrder={() => handleGeneratePO()}
            recentScans={recentScans}
            inventory={inventory}
            purchaseOrders={purchaseOrders}
            totalScansCount={totalScansCount}
            isLoading={dataLoading}
          />
        )

      case 'new-scan':
        return (
          <NewScanView
            onScanComplete={handleScanComplete}
            recentScans={recentScans}
            onSelectScan={handleSelectScan}
            isLoading={dataLoading}
          />
        )

      case 'scan-result':
        return (
          <ScanResultView
            scanData={currentScan}
            isAdmin={isAdmin}
            inventory={inventory}
            onDone={() => setCurrentTab('dashboard')}
            onNavigate={setCurrentTab}
            onGeneratePO={handleGeneratePO}
            onInventoryUpdated={refreshInventory}
          />
        )

      case 'orders':
        return (
          <OrdersView
            purchaseOrders={purchaseOrders}
            onSelectOrder={handleSelectOrder}
            isLoading={dataLoading}
          />
        )

      case 'order-detail':
        return (
          <OrderDetailView
            order={selectedOrder || purchaseOrders[0]}
            isAdmin={isAdmin}
            onBack={() => setCurrentTab('orders')}
            onApprove={handleApprovePO}
            onReject={handleRejectPO}
          />
        )

      case 'inventory':
        return (
          <InventoryView
            inventory={inventory}
            isAdmin={isAdmin}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            isLoading={dataLoading}
          />
        )

      case 'users':
        return (
          <UserManagementView
            isAdmin={isAdmin}
            currentUser={user}
            onShowToast={showToast}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`h-screen w-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden ${getPageBg()}`}>
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-md shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 border-rose-700'
              : toastMessage.type === 'success'
              ? 'bg-emerald-900 border-emerald-700'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'error'
                ? 'bg-rose-400'
                : toastMessage.type === 'success'
                ? 'bg-emerald-400'
                : 'bg-blue-400'
            }`}
          ></span>
          {toastMessage.text}
        </div>
      )}

      {/* Global Top Navbar spanning full width */}
      <header className="h-14 w-full bg-[#3F4168] text-white shrink-0 z-30 flex items-center justify-between px-3 sm:px-5 border-b border-white/10 shadow-2xs select-none">
        {/* Left: Sidebar Collapse Toggle + Custom Brand Logo + Name */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex p-1.5 rounded-md hover:bg-white/10 active:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src={logoImg}
            alt="Shelf Scanner"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain shrink-0 shadow-2xs"
          />
          <span className="font-bold text-base tracking-tight text-white select-none">
            Shelf Scanner
          </span>
        </div>

        {/* Right: User Profile Avatar with dropdown */}
        <div className="relative shrink-0 flex items-center" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="relative w-8 h-8 rounded-full bg-[#d8c4d9] hover:bg-[#cdb6cf] text-[#4a3952] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="User profile menu"
            aria-expanded={isProfileMenuOpen}
          >
            <span>{initial}</span>
            {/* Active online green indicator dot on bottom right */}
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#52b757] ring-2 ring-[#3F4168]"
              title="Online"
            />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 bg-white rounded-md border border-slate-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 text-slate-900">
              {/* Top Section: User Avatar & Details */}
              <div className="p-4 sm:p-5 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#d8c4d9] text-[#4a3952] ring-4 ring-[#ecd8ec]/60 flex items-center justify-center font-black text-lg shadow-xs">
                    {initial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#52b757] ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                    {displayName}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                    {user?.email || 'user@retail.com'}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                    {isAdmin ? 'Store Admin' : 'Store Associate'} · {tenantName}
                  </span>
                </div>
              </div>

              {/* Divider Line */}
              <div className="border-t border-slate-100"></div>

              {/* Bottom Section: Log Out Button */}
              <div className="p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer group text-left"
                >
                  <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-100 transition-colors">
                    <LogOut className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-bold text-rose-600">
                    Log out
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Below Top Navbar: Sidebar on left, Content on right */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {/* Desktop Left Sidebar docked under navbar */}
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar
            currentTab={currentTab}
            onNavigate={setCurrentTab}
            user={user}
            isAdmin={isAdmin}
            onLogout={logout}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        {/* Right Column Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f8f9fa] overflow-hidden">
          <main className="flex-1 h-full min-h-0 overflow-y-auto px-3 sm:px-4 lg:px-5 py-3 max-w-[1600px] 2xl:max-w-[1720px] w-full mx-auto pb-16 md:pb-3 flex flex-col">
            {dataError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs font-bold flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>{dataError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
