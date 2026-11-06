import {
  LayoutDashboard,
  Scan,
  FileText,
  Package,
  Users,
  LogOut,
} from 'lucide-react'

export default function Sidebar({
  currentTab,
  onNavigate,
  user,
  isAdmin,
  onLogout,
}) {
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
      id: 'users',
      label: 'User management',
      icon: Users,
      adminOnly: true,
    },
  ]

  const displayName =
    user?.full_name || user?.name || (isAdmin ? 'Store Admin' : 'Staff')
  const tenantName =
    user?.tenant_name ||
    user?.tenant?.name ||
    user?.store_name ||
    user?.company_name ||
    'Apex Retail'
  const initial = displayName.charAt(0).toUpperCase() || 'S'

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="w-60 bg-white h-full border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none">
      {/* Navigation Items with Icons */}
      <nav className="py-3 space-y-0.5 overflow-y-auto no-scrollbar">
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
              className={`w-full text-left px-5 py-3 text-xs sm:text-sm transition-colors flex items-center gap-3 cursor-pointer ${
                isActive
                  ? 'border-l-4 border-[#3F4168] bg-slate-100/90 text-slate-900 font-bold'
                  : 'border-l-4 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#3F4168]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Section: User Profile & Sign Out Button */}
      <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">
        {/* User Profile Card */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#f0e7fe] text-[#7c3aed] font-bold text-sm flex items-center justify-center shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 truncate">
              ({tenantName})
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs active:scale-[0.99]"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-700" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
