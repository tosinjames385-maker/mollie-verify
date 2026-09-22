import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Shield, Lock } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { isAdminUnlocked, lockAdmin, unlockAdmin, verifyAdminPassword } from '../../lib/adminGate'

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyAdminPassword(password)) {
      setError('Incorrect password')
      return
    }
    unlockAdmin()
    setUnlocked(true)
    setPassword('')
    setError('')
  }

  const handleLock = () => {
    lockAdmin()
    setUnlocked(false)
    navigate('/admin')
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#06090E] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] bg-[#0B1118] border border-[#16212D] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#c7f284]/10 border border-[#c7f284]/30 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#c7f284]" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin access</h1>
            <p className="text-xs text-gray-500 mt-1.5">Enter the admin password to continue.</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <label className="block">
              <span className="sr-only">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Password"
                  autoFocus
                  className="w-full bg-[#060A0E] border border-[#182432] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c7f284]/50"
                />
              </div>
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#c7f284] hover:bg-[#b7e374] text-[#0a0f16] text-sm font-bold transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06090E] text-white flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLockAdmin={handleLock}
      />
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
