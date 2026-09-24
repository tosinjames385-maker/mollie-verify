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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b10] px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#c7f28412,transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#1a2a3a22,transparent_50%)]" />
        <div className="relative w-full max-w-[400px] rounded-2xl border border-[#1c2a38] bg-[#0c1219]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c7f284]/25 bg-[#c7f284]/10">
              <Shield className="h-5 w-5 text-[#c7f284]" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Admin</h1>
            <p className="mt-1.5 text-[13px] text-[#8b98a8]">Enter your password to continue.</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <label className="block">
              <span className="sr-only">Password</span>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6b7a]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Password"
                  autoFocus
                  className="w-full rounded-xl border border-[#1c2a38] bg-[#070b10] py-3 pl-10 pr-4 text-sm text-white placeholder-[#5d6b7a] outline-none transition-colors focus:border-[#c7f284]/50"
                />
              </div>
            </label>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#c7f284] py-3 text-sm font-semibold text-[#07110c] transition-colors hover:bg-[#d4f86a]"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#070b10] text-white">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLockAdmin={handleLock}
      />
      <div className={`flex min-w-0 flex-1 flex-col ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[248px]'}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} onLockAdmin={handleLock} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
