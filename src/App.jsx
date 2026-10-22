import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import DashboardView from './views/DashboardView'
import NewScanView from './views/NewScanView'
import ScanResultView from './views/ScanResultView'
import OrdersView from './views/OrdersView'
import OrderDetailView from './views/OrderDetailView'
import InventoryView from './views/InventoryView'
import {
  initialInventory,
  initialPurchaseOrders,
  initialRecentScans,
} from './data/mockData'

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedOrder, setSelectedOrder] = useState(initialPurchaseOrders[0])
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders)
  const [inventory, setInventory] = useState(initialInventory)
  const [recentScans, setRecentScans] = useState(initialRecentScans)

  // Handle PO approval or rejection
  const handleUpdateOrderStatus = (orderId, newStatus, updatedItems, newTotal) => {
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === orderId
          ? { ...po, status: newStatus, items: updatedItems, total: newTotal }
          : po
      )
    )

    // If approved, restock items in inventory
    if (newStatus === 'Approved') {
      setInventory((prev) =>
        prev.map((invItem) => {
          const ordered = updatedItems.find((item) => item.id === invItem.id)
          if (ordered) {
            const newCount = Math.min(invItem.target, invItem.current + ordered.qty)
            return {
              ...invItem,
              current: newCount,
              status: newCount >= invItem.target ? 'OK' : 'Low',
              history: [...invItem.history.slice(1), newCount],
            }
          }
          return invItem
        })
      )
    }
  }

  // Scan workflow completion
  const handleScanComplete = (scanData) => {
    setCurrentTab('scan-result')
    setRecentScans((prev) => [
      {
        id: `scan-${Date.now()}`,
        shelf: scanData.shelfName || 'Aisle 3 · Shelf B',
        when: 'Now',
        gaps: 2,
        status: 'Done',
      },
      ...prev,
    ])
  }

  const handleSelectOrder = (order) => {
    setSelectedOrder(order)
    setCurrentTab('order-detail')
  }

  const handleGeneratePOFromScan = () => {
    const draftPO = purchaseOrders.find((po) => po.id === 'PO-1042') || purchaseOrders[0]
    setSelectedOrder(draftPO)
    setCurrentTab('order-detail')
  }

  // Render the active view
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setCurrentTab}
            onSelectOrder={handleSelectOrder}
            onSelectScan={() => setCurrentTab('scan-result')}
            purchaseOrders={purchaseOrders}
            recentScans={recentScans}
          />
        )
      case 'new-scan':
        return <NewScanView onScanComplete={handleScanComplete} />
      case 'scan-result':
        return (
          <ScanResultView
            onDone={() => setCurrentTab('dashboard')}
            onGeneratePO={handleGeneratePOFromScan}
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
            order={selectedOrder}
            onBack={() => setCurrentTab('orders')}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )
      case 'inventory':
        return <InventoryView inventory={inventory} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex font-sans antialiased text-slate-900">
      {/* Left Sidebar (Pages 7-12) */}
      <Sidebar currentTab={currentTab} onNavigate={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  )
}
