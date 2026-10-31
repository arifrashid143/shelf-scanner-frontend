import { Home, Scan, ShoppingBag, Package, Users } from 'lucide-react'

export default function BottomNav({ currentTab, onNavigate, isAdmin }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'new-scan', label: 'Scan', icon: Scan },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Stock', icon: Package },
    ...(isAdmin ? [{ id: 'users', label: 'Users', icon: Users }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 py-2 px-6 flex justify-around items-center z-40 md:hidden shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive =
          currentTab === tab.id ||
          (tab.id === 'orders' && currentTab === 'order-detail') ||
          (tab.id === 'new-scan' && currentTab === 'scan-result')

        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[11px]">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
