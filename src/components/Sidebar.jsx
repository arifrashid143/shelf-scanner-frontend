import React from 'react'

export default function Sidebar({ currentTab, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'new-scan', label: 'New scan' },
    { id: 'orders', label: 'Purchase orders' },
    { id: 'inventory', label: 'Inventory' },
  ]

  return (
    <aside className="w-56 bg-white min-h-screen border-r border-slate-200/80 p-6 flex flex-col shrink-0 select-none">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Shelf Scanner
        </h1>
      </div>

      {/* Nav items */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            currentTab === item.id ||
            (item.id === 'orders' && currentTab === 'order-detail') ||
            (item.id === 'new-scan' && currentTab === 'scan-result')

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
