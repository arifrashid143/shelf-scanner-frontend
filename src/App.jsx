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
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders)
  const [inventory, setInventory] = useState(initialInventory)
  const [recentScans, setRecentScans] = useState(initialRecentScans)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch real data from backend API when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      try {
        const [invData, ordersData, scansData] = await Promise.all([
          api.getInventory(),
          api.getOrders(),
          api.getScans(),
        ])
        if (invData?.inventory) setInventory(invData.inventory)
        if (ordersData?.purchaseOrders) {
          setPurchaseOrders(ordersData.purchaseOrders)
          setSelectedOrder(ordersData.purchaseOrders[0])
        }
        if (scansData?.recentScans) setRecentScans(scansData.recentScans)
      } catch (err) {
        console.error('Error fetching initial API data:', err)
      }
    }

    loadData()
  }, [isAuthenticated])

  // --- Purchase Order Actions with Backend Enforcement ---

  const handleGeneratePO = async (customItems = null) => {
    try {
      const res = await api.generateOrder({
        supplier: 'Stationery Hub',
        scanSource: 'Aisle 3, Shelf B',
        items: customItems,
      })
      setPurchaseOrders(res.purchaseOrders)
      setSelectedOrder(res.order)
      setCurrentTab('order-detail')
      showToast(
        `Draft order ${res.order.id} generated! ${
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
      const res = await api.approveOrder(orderId)
      setPurchaseOrders(res.purchaseOrders)
      if (res.inventory) setInventory(res.inventory)
      showToast(`Order ${orderId} Approved & Inventory restocked!`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to approve order (Requires Admin)', 'error')
      throw err
    }
  }

  const handleRejectPO = async (orderId) => {
    try {
      const res = await api.rejectOrder(orderId)
      setPurchaseOrders(res.purchaseOrders)
      showToast(`Order ${orderId} Rejected`, 'info')
    } catch (err) {
      showToast(err.message || 'Failed to reject order (Requires Admin)', 'error')
      throw err
    }
  }

  // --- Inventory Actions with Backend Enforcement ---

  const handleUpdateProduct = async (updateData) => {
    try {
      const res = await api.updateInventory(updateData)
      setInventory(res.inventory)
      showToast('Inventory updated successfully', 'success')
    } catch (err) {
      showToast(err.message || 'Access Denied: Only Admin can update inventory', 'error')
      throw err
    }
  }

  const handleAddProduct = async (productData) => {
    try {
      const res = await api.addInventoryProduct(productData)
      setInventory(res.inventory)
      showToast(`Product "${productData.name}" added to inventory`, 'success')
    } catch (err) {
      showToast(err.message || 'Access Denied: Only Admin can add products', 'error')
      throw err
    }
  }

  // --- Shelf Scan Completion ---
  const handleScanComplete = async (scanData) => {
    try {
      const res = await api.analyzeScan(scanData.shelfName)
      if (res.recentScans) setRecentScans(res.recentScans)
      setCurrentTab('scan-result')
      showToast('Shelf scan analyzed: 8 items counted, 2 empty gaps detected.')
    } catch {
      setCurrentTab('scan-result')
    }
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
            onNavigate={setCurrentTab}
            onSelectOrder={handleSelectOrder}
            onSelectScan={() => setCurrentTab('scan-result')}
            purchaseOrders={purchaseOrders}
            recentScans={recentScans}
            inventory={inventory}
            onQuickApproveOrder={handleApprovePO}
          />
        ) : (
          <UserDashboardView
            onNavigate={setCurrentTab}
            onSelectScan={() => setCurrentTab('scan-result')}
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
            onDone={() => setCurrentTab('dashboard')}
            onGeneratePO={() => handleGeneratePO()}
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
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col md:flex-row font-sans antialiased text-slate-900">
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
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          user={user}
          isAdmin={isAdmin}
          onLogout={logout}
        />
      </div>

      {/* Mobile Top Status Bar with Brand Logo & Sign Out */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
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

      {/* Main Content Area: Optimized for laptop displays and widescreen monitors */}
      <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1550px] 2xl:max-w-[1720px] w-full mx-auto pb-24 md:pb-8 overflow-x-hidden">
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
