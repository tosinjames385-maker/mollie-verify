import { useAuth } from '../../context/AuthContext'
import { Menu, Bell } from 'lucide-react'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth()

  return (
    <header className="h-14 border-b border-[#16212D] bg-[#0A0F16]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-[#16212D] text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-1.5 rounded-lg hover:bg-[#16212D] text-gray-400 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#16212D]">
            <div className="w-7 h-7 rounded-full bg-[#16212D] overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#c7f284]">
                  {(user.displayName || 'A')[0]}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-300 hidden sm:block">{user.displayName}</span>
          </div>
        )}
      </div>
    </header>
  )
}
