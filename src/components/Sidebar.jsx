import {
  LayoutDashboard,
  Scan,
  FileText,
  Package,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function Sidebar({
  currentTab,
  onNavigate,
  isAdmin,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
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

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={`bg-white h-full border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Optional in-sidebar collapse toggle header */}
        {onToggleCollapse && (
          <div
            className={`px-2.5 pt-2 pb-1.5 flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-end'
            } border-b border-slate-100/80`}
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Navigation Items with Icons */}
        <nav className="py-2 space-y-0.5 overflow-y-auto no-scrollbar flex-1">
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
                className={`w-full text-left transition-colors flex items-center cursor-pointer ${
                  isCollapsed
                    ? 'justify-center px-0 py-3 relative group'
                    : 'px-5 py-3 gap-3 text-xs sm:text-sm'
                } ${
                  isActive
                    ? 'border-l-4 border-[#3F4168] bg-slate-100/90 text-slate-900 font-bold'
                    : 'border-l-4 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <Icon
                  className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
                    isActive ? 'text-[#3F4168]' : 'text-slate-400 group-hover:text-slate-700'
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
          isCollapsed ? 'p-2 flex justify-center' : 'p-3.5'
        }`}
      >
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className={`rounded-md border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-[0.99] ${
            isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2 px-3 gap-2'
          }`}
        >
          <LogOut className={`${isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-slate-700`} />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
