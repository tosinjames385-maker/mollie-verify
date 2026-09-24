import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  AtSign,
  ClipboardList,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
  Wallet,
  Bot,
} from 'lucide-react'
import { isEduPhishingDemoEnabled } from '../../lib/eduPhishDemo'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  onLockAdmin?: () => void
}

const overviewItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/x-accounts', icon: AtSign, label: 'X Accounts' },
]

const opsItems = [
  { to: '/admin/submissions', icon: ClipboardList, label: 'Submissions' },
  { to: '/admin/activity', icon: Activity, label: 'Activity' },
  { to: '/admin/wallet-connect', icon: Wallet, label: 'Wallet Connect' },
  { to: '/admin/bot', icon: Bot, label: 'Bot' },
]

const systemItems = [{ to: '/admin/settings', icon: Settings, label: 'Settings' }]

const scamDemoNav = { to: '/admin/scam-demo', icon: AlertTriangle, label: 'Scam demo', end: false as const }

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  onLockAdmin,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const operations = isEduPhishingDemoEnabled() ? [...opsItems.slice(0, 2), scamDemoNav, ...opsItems.slice(2)] : opsItems

  const handleLogout = async () => {
    onLockAdmin?.()
    await logout()
    navigate('/')
  }

  return (
    <>
      {isOpen ? <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} /> : null}

      <aside
        className={`
        fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[#1c2a38] bg-[#0a0f14]
        transition-all duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${collapsed ? 'lg:w-[72px]' : 'lg:w-[248px]'}
      `}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#1c2a38] px-3">
          {!collapsed ? (
            <div className="flex min-w-0 items-center gap-2.5 px-1">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#c7f284]/10">
                <Shield className="h-4 w-4 text-[#c7f284]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">Admin</p>
                <p className="truncate text-[10px] text-[#5d6b7a]">Control panel</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#c7f284]/10">
              <Shield className="h-4 w-4 text-[#c7f284]" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-1.5 text-[#5d6b7a] transition-colors hover:bg-[#16212d] hover:text-white lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
          <NavGroup label="Overview" collapsed={collapsed} items={overviewItems} onClose={onClose} />
          <NavGroup label="Operations" collapsed={collapsed} items={operations} onClose={onClose} />
          <NavGroup label="System" collapsed={collapsed} items={systemItems} onClose={onClose} />
        </nav>

        <div className="flex-shrink-0 border-t border-[#1c2a38] p-2.5">
          {!collapsed && user ? (
            <div className="mb-2 rounded-xl bg-[#0d131a] px-3 py-2.5">
              <p className="truncate text-[12px] font-medium text-white">{user.displayName}</p>
              <p className="truncate text-[11px] text-[#5d6b7a]">{user.handle}</p>
            </div>
          ) : null}
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium text-[#8b98a8] transition-colors hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed ? <span>Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  )
}

function NavGroup({
  label,
  collapsed,
  items,
  onClose,
}: {
  label: string
  collapsed: boolean
  items: { to: string; icon: typeof LayoutDashboard; label: string; end?: boolean }[]
  onClose: () => void
}) {
  return (
    <div>
      {!collapsed ? (
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5d6b7a]">{label}</p>
      ) : null}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `
                relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors
                ${isActive ? 'bg-[#c7f284]/10 text-[#c7f284]' : 'text-[#8b98a8] hover:bg-[#16212d] hover:text-white'}
                ${collapsed ? 'justify-center px-2' : ''}
              `}
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed ? (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#c7f284]" />
                ) : null}
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
