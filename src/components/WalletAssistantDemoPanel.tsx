import React, { useEffect, useState } from 'react'
import { ChevronLeft, Menu, Shield, Lock, Eye, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { WalletBrandIcon } from './walletIcons'

type View = 'home' | 'settings' | 'security'

interface WalletAssistantDemoPanelProps {
  walletBrand: string
  walletIcon: string
  onBack: () => void
  onClose: () => void
}

const SECURITY_ACTIONS = [
  { id: 'auto-lock', label: 'Auto-lock timer', icon: Clock },
  { id: 'change-password', label: 'Change password', icon: Lock },
  { id: 'reveal-seed', label: 'Reveal recovery phrase', icon: Eye },
  { id: 'privacy-mode', label: 'Privacy mode', icon: Shield },
] as const

export const WalletAssistantDemoPanel: React.FC<WalletAssistantDemoPanelProps> = ({
  walletBrand,
  walletIcon,
  onBack,
  onClose,
}) => {
  const [view, setView] = useState<View>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [clicked, setClicked] = useState<string[]>([])

  useEffect(() => {
    setView('home')
    setMenuOpen(false)
    setClicked([])
  }, [walletBrand])

  const recordClick = (id: string, label: string) => {
    setClicked((prev) => (prev.includes(id) ? prev : [...prev, id]))
    toast(`Demo: ${label}`, { icon: '🤖', duration: 2000 })
    try {
      const key = 'vrfd_assistant_bot_steps'
      const prev = JSON.parse(localStorage.getItem(key) || '[]') as { id: string; label: string; at: string }[]
      prev.push({ id, label, at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(prev.slice(-40)))
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="relative flex flex-col flex-1 min-h-0 overflow-hidden bg-[#121314] text-white"
      data-testid="wallet-assistant-demo"
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#2a2b2c] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {view !== 'home' ? (
            <button
              type="button"
              data-testid="wallet-demo-back"
              onClick={() => setView(view === 'security' ? 'settings' : 'home')}
              className="w-8 h-8 rounded-lg hover:bg-[#1e1f20] flex items-center justify-center"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="wallet-demo-menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-8 h-8 rounded-lg hover:bg-[#1e1f20] flex items-center justify-center"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-sm font-semibold truncate">
            {view === 'home' && walletBrand}
            {view === 'settings' && 'Settings'}
            {view === 'security' && 'Security & Privacy'}
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-[#9ca3af] hover:text-white px-2">
          Close
        </button>
      </div>

      {menuOpen && view === 'home' && (
        <div className="absolute left-4 top-14 z-20 w-52 rounded-xl border border-[#2a2b2c] bg-[#1a1b1c] shadow-xl py-1">
          <button
            type="button"
            data-testid="wallet-demo-nav-settings"
            onClick={() => {
              setMenuOpen(false)
              setView('settings')
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#252627]"
          >
            Settings
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {view === 'home' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1b1c] border border-[#2a2b2c] flex items-center justify-center mb-4">
              <WalletBrandIcon name={walletIcon} className="w-10 h-10" />
            </div>
            <p className="text-lg font-semibold">{walletBrand}</p>
            <p className="text-xs text-[#9ca3af] mt-1">Demo wallet — assistant navigates menus here only</p>
            <p className="text-[11px] text-[#6b7280] mt-6 max-w-[260px]">
              Open the menu → Settings → Security & Privacy to continue the demo.
            </p>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-2">
            <button
              type="button"
              data-testid="wallet-demo-nav-security"
              onClick={() => setView('security')}
              className="w-full flex items-center justify-between rounded-xl border border-[#2a2b2c] bg-[#1a1b1c] px-4 py-3.5 text-left hover:bg-[#222324]"
            >
              <span className="text-sm font-medium">Security & Privacy</span>
              <ChevronLeft className="w-4 h-4 rotate-180 text-[#6b7280]" />
            </button>
            <button
              type="button"
              data-testid="wallet-demo-nav-general"
              onClick={() => recordClick('general', 'General settings')}
              className="w-full flex items-center justify-between rounded-xl border border-[#2a2b2c] bg-[#1a1b1c] px-4 py-3.5 text-left hover:bg-[#222324] opacity-70"
            >
              <span className="text-sm font-medium">General</span>
            </button>
          </div>
        )}

        {view === 'security' && (
          <div className="space-y-3">
            <p className="text-xs text-[#9ca3af] mb-2">Tap any control — the assistant bot can click each for the demo.</p>
            {SECURITY_ACTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                data-testid={`wallet-demo-action-${id}`}
                onClick={() => recordClick(id, label)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  clicked.includes(id)
                    ? 'border-[#0376c9] bg-[#0376c9]/10'
                    : 'border-[#2a2b2c] bg-[#1a1b1c] hover:bg-[#222324]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#9ca3af]" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-[#2a2b2c] flex-shrink-0">
        <button type="button" onClick={onBack} className="text-xs text-[#9ca3af] hover:text-white">
          ← Back to wallet list
        </button>
      </div>
    </div>
  )
}
