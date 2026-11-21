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
  Settings,
  User,
  SunMoon,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react'

export default function Sidebar({
  currentTab,
  onNavigate,
  user,
  isAdmin,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  theme = 'light',
  onThemeChange,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsView, setSettingsView] = useState('menu') // 'menu' | 'profile' | 'theme'
  const settingsRef = useRef(null)

  const displayName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Store Admin'
  const initial = displayName.charAt(0).toUpperCase()
  const tenantName = user?.tenant_name || user?.store_name || user?.company_name || 'Apex Retail'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false)
        setSettingsView('menu')
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false)
        setSettingsView('menu')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
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
      className={`bg-white dark:bg-slate-900 h-full border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ease-in-out shadow-2xs ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Top of Navbar: Brand Logo & Title (Shelf Scanner) + Sidebar Collapse Toggle */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={logoImg}
              alt="Shelf Scanner"
              className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-2xs ring-1 ring-slate-200/90 dark:ring-slate-700 bg-white"
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight truncate">
                  Shelf Scanner
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block leading-tight truncate">
                  Visual AI
                </span>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          )}
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
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border-l-4 border-indigo-600 shadow-2xs border-y border-r border-indigo-100/70 dark:border-indigo-900/60'
                    : 'border border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <Icon
                  className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom of Navbar: Settings Option */}
      <div
        className="p-2 border-t border-slate-100 dark:border-slate-800 shrink-0 relative"
        ref={settingsRef}
      >
        {/* Settings Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsSettingsOpen((prev) => !prev)
            setSettingsView('menu')
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'
          } rounded-xl border ${
            isSettingsOpen
              ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
          } transition-all cursor-pointer shadow-2xs group`}
          title={isCollapsed ? 'Settings' : undefined}
          aria-label="Settings option"
          aria-expanded={isSettingsOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                isSettingsOpen
                  ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="text-xs font-bold truncate">Settings</span>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 shrink-0 ${
                isSettingsOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
          )}
        </button>

        {/* Settings Flyout Popover */}
        {isSettingsOpen && (
          <div
            className={`absolute bottom-full mb-2 ${
              isCollapsed ? 'left-full ml-2 w-72' : 'left-0 right-0 w-64'
            } bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 text-slate-900 dark:text-slate-100 ring-1 ring-black/5 dark:ring-white/10`}
          >
            {/* VIEW 1: Initial 3 options: Profile, Theme, Sign out */}
            {settingsView === 'menu' && (
              <div className="p-1.5 space-y-1">
                {/* 1. Profile Option */}
                <button
                  type="button"
                  onClick={() => setSettingsView('profile')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs font-bold text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate leading-tight text-slate-900 dark:text-white">Profile</p>
                      <p className="text-[10px] font-normal text-slate-400 dark:text-slate-400 truncate leading-tight mt-0.5">
                        {displayName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
                </button>

                {/* 2. Theme Option */}
                <button
                  type="button"
                  onClick={() => setSettingsView('theme')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs font-bold text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <SunMoon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate leading-tight text-slate-900 dark:text-white">Theme</p>
                      <p className="text-[10px] font-normal text-slate-400 dark:text-slate-400 truncate capitalize leading-tight mt-0.5">
                        {theme} mode
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* 3. Sign out Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false)
                    setSettingsView('menu')
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-xs font-bold text-left group"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 transition-colors shrink-0">
                    <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <span className="truncate">Sign out</span>
                </button>
              </div>
            )}

            {/* VIEW 2: Profile Details View (Opens on clicking Profile) */}
            {settingsView === 'profile' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-150">
                {/* Back Button & Header */}
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsView('menu')}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Back to options"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Profile Details</span>
                </div>

                {/* Profile Details Content */}
                <div className="p-3.5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {initial}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-400 truncate mt-0.5">
                        {user?.email || 'user@retail.com'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Role</span>
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                        {isAdmin ? 'Store Admin' : 'Store Associate'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Store / Org</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {tenantName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: Theme Modes View (Opens on clicking Theme) */}
            {settingsView === 'theme' && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-150">
                {/* Back Button & Header */}
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsView('menu')}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Back to options"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Choose Theme</span>
                </div>

                {/* Theme Options List */}
                <div className="p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => onThemeChange?.('light')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs">Light mode</span>
                    </div>
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange?.('dark')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs">Dark mode</span>
                    </div>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange?.('system')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      theme === 'system'
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Monitor className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">System default</span>
                    </div>
                    {theme === 'system' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
