import logoImg from '../assets/logo.png'
import {
  LayoutDashboard,
  Scan,
  FileText,
  Package,
  Users,
  LogOut,
  ShieldCheck,
  UserCheck,
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

  const displayName = user?.full_name || user?.name || 'Platform Superadmin'
  const initial = displayName.charAt(0).toUpperCase() || 'P'

  return (
    <div className="h-full flex flex-col shrink-0 select-none pl-4 pr-2 pt-4 pb-4">
      {/* Brand Logo & Name outside the navigation bar */}
      <div className="h-10 flex items-center gap-3 px-1 mb-4 shrink-0">
        <img
          src={logoImg}
          alt="Shelf Scanner Logo"
          className="w-9 h-9 rounded-xl shadow-xs object-contain shrink-0"
        />
        <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
          Shelf Scanner
        </h1>
      </div>

      {/* Navigation Bar (Floating card with top, bottom, and left margins) */}
      <aside className="w-60 bg-white flex-1 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs min-h-0">
        {/* Navigation Items with Icons */}
        <nav className="space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              currentTab === item.id ||
              (item.id === 'orders' && currentTab === 'order-detail') ||
              (item.id === 'new-scan' && currentTab === 'scan-result')

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all font-semibold flex items-center gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.adminOnly && (
                  <span className={`ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-50 text-purple-700 border border-purple-200/80'
                  }`}>
                    Admin
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Section: User Profile & Separated Logout */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 shrink-0">
          {/* User Profile Card */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 flex items-center gap-3 overflow-hidden shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 border border-purple-200">
              {initial}
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {displayName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                    <ShieldCheck className="w-3 h-3 text-purple-600" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                    <UserCheck className="w-3 h-3 text-blue-600" /> Staff
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Standalone Logout Option Apart from User Profile */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/80 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
