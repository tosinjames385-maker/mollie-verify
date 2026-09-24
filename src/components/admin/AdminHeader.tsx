import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Menu } from 'lucide-react'

interface AdminHeaderProps {
  onMenuClick: () => void
  onLockAdmin?: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/x-accounts': 'X Accounts',
  '/admin/submissions': 'Submissions',
  '/admin/activity': 'Activity',
  '/admin/wallet-connect': 'Wallet Connect',
  '/admin/bot': 'Bot',
  '/admin/settings': 'Settings',
  '/admin/scam-demo': 'Scam demo',
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, onLockAdmin }) => {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'Admin'

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-[#1c2a38] bg-[#070b10]/85 px-4 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-[#8b98a8] transition-colors hover:bg-[#16212d] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#5d6b7a]">Admin</p>
          <p className="truncate text-[14px] font-semibold text-white">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onLockAdmin ? (
          <button
            type="button"
            onClick={onLockAdmin}
            className="rounded-lg p-2 text-[#8b98a8] transition-colors hover:bg-[#16212d] hover:text-white"
            title="Lock admin"
          >
            <Lock className="h-4 w-4" />
          </button>
        ) : null}
        {user ? (
          <div className="flex items-center gap-2.5 border-l border-[#1c2a38] pl-3">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#16212d]">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#c7f284]">
                  {(user.displayName || 'A')[0]}
                </div>
              )}
            </div>
            <span className="hidden text-[13px] font-medium text-[#d5dde6] sm:block">{user.displayName}</span>
          </div>
        ) : null}
      </div>
    </header>
  )
}
