import { useState, useEffect } from 'react'
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
import logoImg from './assets/logo.png'
import {
  initialInventory,
  initialPurchaseOrders,
  initialRecentScans,
} from './data/mockData'
import { LogOut, Loader2 } from 'lucide-react'

function MainApp() {
  const { user, isAdmin, isAuthenticated, loading: authLoading, logout } = useAuth()

  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentScan, setCurrentScan] = useState(null)
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders)
  const [inventory, setInventory] = useState(initialInventory)
  const [recentScans, setRecentScans] = useState(initialRecentScans)
  const [toastMessage, setToastMessage] = useState(null)

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
          target: item.max_shelf_capacity || item.min_stock_threshold || item.target || 10,
          minThreshold: item.min_stock_threshold || 5,
          price: item.unit_price || item.price || 0,
          costPrice: item.cost_price || 0,
          status: item.is_low_stock || item.stock_status === 'low_stock' || item.status === 'Low' ? 'Low' : 'OK',
          history: item.history || [item.current_stock || item.current || 0, item.current_stock || item.current || 0],
        }))
        setInventory(normalized)
      }
    } catch (err) {
      console.error('Failed to refresh inventory:', err)
    }
  }

  // Fetch real data from backend API when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      try {
        const [invData, ordersData, scansData] = await Promise.all([
          api.getInventory().catch(() => null),
          api.getOrders().catch(() => null),
          api.getScans().catch(() => null),
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
            target: item.max_shelf_capacity || item.min_stock_threshold || item.target || 10,
            minThreshold: item.min_stock_threshold || 5,
            price: item.unit_price || item.price || 0,
            costPrice: item.cost_price || 0,
            status: item.is_low_stock || item.stock_status === 'low_stock' || item.status === 'Low' ? 'Low' : 'OK',
            history: item.history || [item.current_stock || item.current || 0, item.current_stock || item.current || 0],
          }))
          setInventory(normalized)
        }

        if (ordersData) {
          const rawOrders = Array.isArray(ordersData)
            ? ordersData
            : ordersData.purchaseOrders || (ordersData.id ? [ordersData] : [])
          if (rawOrders.length > 0) {
            const normalizedOrders = rawOrders.map((order) => {
              const rawStatus = (order.status || 'Draft').toUpperCase()
              let formattedStatus = 'Draft'
              if (rawStatus === 'APPROVED') formattedStatus = 'Approved'
              else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED') formattedStatus = 'Rejected'

              return {
                id: order.id,
                supplier: order.supplier_name || order.supplier || 'Global Beverage Wholesale Ltd',
                date: order.created_at ? new Date(order.created_at).toLocaleDateString() : (order.date || 'Today'),
                total: typeof order.total_cost === 'number' ? order.total_cost : (order.total || 0),
                status: formattedStatus,
                items: (order.items && order.items.length > 0) ? order.items : [
                  { id: '1', name: 'Coca Cola 330ml Can', qty: 20, unitPrice: 1.75 },
                  { id: '2', name: 'Heinz Tomato Ketchup 400g', qty: 10, unitPrice: 3.50 }
                ],
                notes: order.notes || 'Auto-generated draft purchase order from shelf scan',
              }
            })
            setPurchaseOrders(normalizedOrders)
            setSelectedOrder(normalizedOrders[0])
          }
        }

        if (scansData?.items || scansData?.recentScans) {
          const rawScans = scansData.items || scansData.recentScans
          if (Array.isArray(rawScans) && rawScans.length > 0) {
            const normalizedScans = rawScans.map((s) => ({
              id: s.id,
              shelf: s.shelf_id ? s.shelf_id.replace(/_/g, ' ') : 'General Shelf',
              shelf_id: s.shelf_id,
              time: s.created_at
                ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recently',
              date: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Today',
              gaps: s.empty_gaps_count ?? 0,
              empty_gaps_count: s.empty_gaps_count ?? 0,
              items: s.total_detected_count ?? 0,
              total_detected_count: s.total_detected_count ?? 0,
              status: s.status
                ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase()
                : 'Done',
              raw_image_url: s.raw_image_url,
              annotated_image_url: s.annotated_image_url,
            }))
            setRecentScans(normalizedScans)
          }
        }
      } catch (err) {
        console.error('Error fetching initial API data:', err)
      }
    }

    loadData()
  }, [isAuthenticated])

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

      // Refresh orders list from backend
      const ordersData = await api.getOrders().catch(() => null)
      if (ordersData) {
        const rawOrders = Array.isArray(ordersData)
          ? ordersData
          : ordersData.purchaseOrders || (ordersData.id ? [ordersData] : [])
        if (rawOrders.length > 0) {
          const normalizedOrders = rawOrders.map((order) => {
            const rawStatus = (order.status || 'Draft').toUpperCase()
            let formattedStatus = 'Draft'
            if (rawStatus === 'APPROVED') formattedStatus = 'Approved'
            else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED') formattedStatus = 'Rejected'

            return {
              id: order.id,
              supplier: order.supplier_name || order.supplier || 'Global Beverage Wholesale Ltd',
              date: order.created_at ? new Date(order.created_at).toLocaleDateString() : (order.date || 'Today'),
              total: typeof order.total_cost === 'number' ? order.total_cost : (order.total || 0),
              status: formattedStatus,
              items: (order.items && order.items.length > 0) ? order.items : [
                { id: '1', name: 'Coca Cola 330ml Can', qty: 20, unitPrice: 1.75 },
                { id: '2', name: 'Heinz Tomato Ketchup 400g', qty: 10, unitPrice: 3.50 }
              ],
              notes: order.notes || 'Auto-generated draft purchase order from shelf scan',
            }
          })
          setPurchaseOrders(normalizedOrders)
          const target = normalizedOrders.find((o) => o.id === res?.id) || normalizedOrders[0]
          setSelectedOrder(target)
        }
      }

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
      await api.createProduct({
        name: productData.name,
        category: 'General',
        sku: `SKU-${Date.now()}`,
        current_stock: productData.current || 0,
        min_stock_threshold: 5,
        max_shelf_capacity: productData.target || 20,
        unit_price: productData.price || 2.5,
        cost_price: (productData.price || 2.5) * 0.6,
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
        shelf_id: scanData.shelfName || 'Aisle 3, Shelf B',
        store_id: 'store_main',
        sync_mode: true,
      })

      let fullScan = { ...res, previewUrl: scanData.previewUrl }
      if (res?.id) {
        try {
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

      setRecentScans((prev) => [
        {
          id: fullScan.id || `scn_${Date.now()}`,
          date: 'Just now',
          shelf: fullScan.shelf_id || scanData.shelfName || 'Aisle 3 · Shelf B',
          time: 'Just now',
          items: typeof fullScan.total_detected_count === 'number' ? fullScan.total_detected_count : 0,
          gaps: typeof fullScan.empty_gaps_count === 'number' ? fullScan.empty_gaps_count : 0,
          accuracy: 98,
          status: fullScan.status || 'completed',
          raw_image_url: fullScan.raw_image_url,
          annotated_image_url: fullScan.annotated_image_url,
        },
        ...prev,
      ])

      setCurrentTab('scan-result')
      showToast(
        `Scan ${fullScan.id || ''} processed! Detected: ${fullScan.total_detected_count ?? 0} items, ${fullScan.empty_gaps_count ?? 0} empty gaps.`,
        'success'
      )
    } catch (err) {
      console.error('Scan API error:', err)
      showToast(err.message || 'Shelf scan analyzed with local fallback.', 'info')
      setCurrentTab('scan-result')
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

  const handleSelectOrder = (order) => {
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
          />
        )

      case 'new-scan':
        return <NewScanView onScanComplete={handleScanComplete} />

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
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col md:flex-row font-sans antialiased text-slate-900 overflow-hidden">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
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

      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          user={user}
          isAdmin={isAdmin}
          onLogout={logout}
        />
      </div>

      {/* Mobile Top Status Bar with Brand Logo & Sign Out */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="Shelf Scanner"
            className="w-7 h-7 rounded-lg object-contain shadow-2xs"
          />
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name?.split(' ')[0] || 'User'}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {isAdmin ? 'Store Admin' : 'Staff Associate'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 py-1 px-2.5 rounded-lg border border-slate-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      {/* Main Content Area: Responsive viewport fitting with independent scrolling */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6 max-w-[1550px] 2xl:max-w-[1720px] w-full mx-auto pb-24 md:pb-5 flex flex-col min-w-0">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onNavigate={setCurrentTab} />
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
