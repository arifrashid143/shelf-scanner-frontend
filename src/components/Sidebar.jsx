import logoImg from '../assets/logo.png'
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react'

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
      label: isAdmin ? 'Admin Dashboard' : 'User Dashboard',
    },
    { id: 'new-scan', label: 'Scan shelf' },
    { id: 'orders', label: 'Purchase orders' },
    {
      id: 'inventory',
      label: isAdmin ? 'Inventory (Admin)' : 'View Inventory',
    },
  ]

  return (
    <aside className="w-60 bg-white min-h-screen border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Logo & Name */}
        <div className="mb-8 flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="Shelf Scanner Logo"
            className="w-8 h-8 rounded-xl shadow-xs object-contain"
          />
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
              Shelf Scanner
            </h1>
            <span className="text-[10px] text-slate-400 font-medium">
              AI Retail Ops
            </span>
          </div>
        </div>

        {/* Navigation Items */}
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
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors font-bold ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* User Profile Card & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                isAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {user?.name?.[0] || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-700">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600">
                    <UserCheck className="w-3 h-3" /> Staff User
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
