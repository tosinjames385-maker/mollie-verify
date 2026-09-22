import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, AtSign, ClipboardList,
  Activity, Settings, LogOut, ChevronLeft, ChevronRight, Shield, AlertTriangle, Wallet, Bot
} from 'lucide-react'
import { isEduPhishingDemoEnabled } from '../../lib/eduPhishDemo'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  onLockAdmin?: () => void
}

const baseNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/x-accounts', icon: AtSign, label: 'X Accounts' },
  { to: '/admin/submissions', icon: ClipboardList, label: 'Submissions' },
  { to: '/admin/activity', icon: Activity, label: 'Activity' },
  { to: '/admin/wallet-connect', icon: Wallet, label: 'Wallet Connect' },
  { to: '/admin/bot', icon: Bot, label: 'Bot' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

const scamDemoNav = { to: '/admin/scam-demo', icon: AlertTriangle, label: 'Scam demo', end: false as const }

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen, onClose, collapsed, onToggleCollapse, onLockAdmin
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = isEduPhishingDemoEnabled()
    ? [...baseNavItems.slice(0, 5), scamDemoNav, ...baseNavItems.slice(5)]
    : baseNavItems

  const handleLogout = async () => {
    onLockAdmin?.()
    await logout()
    navigate('/')
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-[#0A0F16] border-r border-[#16212D] z-50
        flex flex-col transition-all duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${collapsed ? 'lg:w-[60px]' : 'lg:w-[220px]'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-[#16212D] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-5 h-5 text-[#c7f284] flex-shrink-0" />
              <span className="text-sm font-bold text-white truncate">Admin</span>
            </div>
          )}
          {collapsed && <Shield className="w-5 h-5 text-[#c7f284] mx-auto" />}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded hover:bg-[#16212D] text-gray-500 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
                ${isActive
                  ? 'bg-[#c7f284]/10 text-[#c7f284]'
                  : 'text-gray-400 hover:text-white hover:bg-[#16212D]'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Admin Profile */}
        <div className="p-2 border-t border-[#16212D] flex-shrink-0">
          {!collapsed && user && (
            <div className="px-2.5 py-1.5 mb-1.5">
              <p className="text-xs font-medium text-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.handle}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
