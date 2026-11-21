import { useState, useRef, useEffect } from 'react'
import logoImg from '../assets/logo.png'
import {
  LayoutDashboard,
  Scan,
  FileText,
  Package,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Truck,
  BarChart3,
} from 'lucide-react'

export default function Sidebar({
  currentTab,
  onNavigate,
  user,
  isAdmin,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const displayName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Store Admin'
  const initial = displayName.charAt(0).toUpperCase()
  const tenantName = user?.tenant_name || user?.store_name || user?.company_name || 'Apex Retail'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'new-scan',
      label: 'Scan shelf',
      icon: Scan,
    },
    {
      id: 'orders',
      label: 'Purchase orders',
      icon: FileText,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
    },
    {
      id: 'shelves',
      label: 'Shelves & Stores',
      icon: Layers,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
    },
    {
      id: 'analytics',
      label: 'Vision Analytics',
      icon: BarChart3,
    },
    {
      id: 'users',
      label: 'User management',
      icon: Users,
      adminOnly: true,
    },
  ]

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={`bg-white h-full border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ease-in-out shadow-2xs ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Top of Navbar: Brand Logo & Profile Option */}
        <div className="p-3 border-b border-slate-100 flex flex-col gap-2 shrink-0 bg-slate-50/40">
          {/* Row 1: Logo & Brand + Collapse Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={logoImg}
                alt="Shelf Scanner"
                className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-2xs ring-1 ring-slate-200/90 bg-white"
              />
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight truncate">
                    ApexShelf
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 block leading-tight truncate">
                    Visual AI
                  </span>
                </div>
              )}
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Row 2: User Profile Option with Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
              } rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer shadow-2xs group text-left`}
              title={isCollapsed ? displayName : undefined}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {initial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                      {isAdmin ? 'Store Admin' : 'Store Associate'}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 ml-1" />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 text-slate-900">
                <div className="p-3 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{user?.email || 'user@retail.com'}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    {tenantName}
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs font-bold text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items with Icons */}
        <nav className="py-2.5 space-y-1 overflow-y-auto no-scrollbar flex-1 px-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              currentTab === item.id ||
              (item.id === 'orders' && currentTab === 'order-detail') ||
              (item.id === 'new-scan' && currentTab === 'scan-result')

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`w-full text-left transition-all flex items-center cursor-pointer rounded-lg ${
                  isCollapsed
                    ? 'justify-center px-0 py-2.5 relative group'
                    : 'px-3 py-2.5 gap-2.5 text-xs sm:text-sm'
                } ${
                  isActive
                    ? 'bg-indigo-50/90 text-indigo-700 font-bold border-l-4 border-indigo-600 shadow-2xs border-y border-r border-indigo-100/70'
                    : 'border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <Icon
                  className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section: Sign Out Button */}
      <div
        className={`border-t border-slate-100 shrink-0 ${
          isCollapsed ? 'p-2 flex justify-center' : 'p-3'
        }`}
      >
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className={`rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-700 text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-[0.99] group ${
            isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2 px-3 gap-2'
          }`}
        >
          <LogOut className={`${isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-slate-500 group-hover:text-rose-600 transition-colors`} />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
