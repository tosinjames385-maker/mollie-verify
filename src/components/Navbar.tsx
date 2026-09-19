import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, X, Wallet, Copy, ExternalLink, ChevronDown, LogOut } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { TokenSelector } from './TokenSelector'
import { ConnectWalletModal } from './ConnectWalletModal'
import { useAuth } from '../context/AuthContext'
import { useWalletState } from '../context/WalletContext'
import type { LiveToken } from '../services/tokenService'

export const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()
  const {
    connected,
    walletAddress,
    shortAddress,
    balanceSol,
    isVerified,
    openWalletModal,
    closeWalletModal,
    isModalOpen,
    disconnectWallet,
    walletName,
  } = useWalletState()
  const { publicKey, wallet } = useWallet()

  const [showSelector, setShowSelector] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)

  const handleSelectLiveToken = (token: LiveToken) => {
    setShowSelector(false)
    navigate(`/token/${token.mintAddress}`, { state: { selectedToken: token } })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !showSelector) {
        e.preventDefault()
        setShowSelector(true)
      }
      if (e.key === 'Escape') {
        setShowSelector(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSelector])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { to: '/submissions', label: 'Submissions' },
    { to: '/media', label: 'Media' },
    { to: '/faq', label: 'FAQ' },
    { to: '/apis', label: 'APIs' },
  ]

  const sidebarLinks = [
    { to: '/submissions', label: 'Submissions', description: 'View all verification and metadata update requests for tokens', icon: 'checkmark' },
    { to: '/leaderboard', label: 'Leaderboard', description: 'Leaderboard: see the top signal generators on VRFD', icon: 'chart' },
    { to: '/media', label: 'Media', icon: 'play' },
    { to: '/faq', label: 'FAQ', icon: 'help' },
    { to: '/apis', label: 'APIs', icon: 'code' },
  ]

  const isActive = (path: string) => location.pathname === path

  const getNavIcon = (icon: string) => {
    switch (icon) {
      case 'checkmark':
        return (
          <svg className="w-5 h-5 text-[#00D2B8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      case 'chart':
        return (
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 18h16M7 18v-5M12 18V9M17 18v-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6l.01.01" strokeLinecap="round" strokeWidth="3" />
          </svg>
        )
      case 'play':
        return (
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        )
      case 'help':
        return (
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      case 'code':
        return <span className="text-lg font-mono text-gray-300">&lt;/&gt;</span>
      default:
        return null
    }
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-40 bg-[#060B11]/95 backdrop-blur-md border-b border-[#141B24] h-[54px] items-center px-4">
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo & Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="VRFD" className="w-full h-full object-cover" />
              </div>
            </Link>

            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-base font-semibold transition-colors ${
                    isActive(link.to) 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-6">
            <button
              onClick={() => setShowSelector(true)}
              className="w-full text-left"
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="w-full bg-[#0A1017] border border-[#1C2838] rounded-full pl-11 pr-4 py-1.5 text-sm text-gray-400 flex items-center justify-between hover:border-gray-700 transition-colors">
                  <span>Search</span>
                  <kbd className="text-[10px] text-gray-500 bg-[#141E2C] px-1.5 py-0.5 rounded font-mono">/</kbd>
                </div>
              </div>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* SOLANA WALLET CONNECTION BUTTON / ACCOUNT MENU */}
            {connected && publicKey ? (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white px-3 py-1.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c7f284] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c7f284]"></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {shortAddress}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {walletMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-[#0F1722] border border-[#1C2A3A] rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                    <div className="px-3 py-2 border-b border-[#1C2A3A]">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Connected Wallet</p>
                      <p className="font-mono text-xs text-[#c7f284] font-bold truncate mt-0.5">{publicKey.toBase58()}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{wallet?.adapter.name || 'Solana Wallet'}</p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publicKey.toBase58())
                        toast.success('Wallet address copied!')
                        setWalletMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl flex items-center gap-2.5 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                      <span>Copy Address</span>
                    </button>

                    <a
                      href={`https://solscan.io/account/${publicKey.toBase58()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setWalletMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl flex items-center gap-2.5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <span>View on Explorer</span>
                    </a>

                    <button
                      onClick={async () => {
                        setWalletMenuOpen(false)
                        await disconnectWallet()
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openWalletModal}
                className="bg-[#c7f284] hover:bg-[#b5e66f] text-[#06090E] font-extrabold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md hover:shadow-[#c7f284]/20 active:scale-95 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Leaderboard Icon */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-white hover:opacity-80 transition-opacity p-1"
              title="Leaderboard"
            >
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16" y1="216" x2="240" y2="216" />
                <rect x="24" y="136" width="56" height="80" rx="8" />
                <rect x="96" y="72" width="64" height="144" rx="8" />
                <rect x="176" y="160" width="56" height="56" rx="8" />
                <circle cx="128" cy="108" r="10" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {/* X User Profile Badge Pill */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white px-2.5 py-1 rounded-full flex items-center gap-2 transition-all cursor-pointer"
                >
                  <div className="relative w-6 h-6 rounded-full bg-[#0099FF] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.username.charAt(0).toLowerCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00D2B8] border-2 border-[#0D1520] rounded-full" />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-44 bg-[#0F1722] border border-[#1C2A3A] rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate(`/profile/${user.username}`)
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>My Profile</span>
                    </button>

                    {user.isAdmin && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/admin')
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Control Center</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="bg-[#F5F5F5] hover:bg-white text-black font-semibold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Sign in with</span>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#060B11]/95 backdrop-blur-md border-b border-[#141B24]">
        <div className="h-[54px] px-3 flex items-center justify-between gap-2">
          {/* Left: Sphere Logo + Hamburger Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="VRFD" className="w-full h-full object-cover" />
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-[160px]">
            <button
              onClick={() => setShowSelector(true)}
              className="w-full text-left"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <div className="w-full bg-[#0A1017] border border-[#1C2838] rounded-full pl-8 pr-2 py-1 text-[11px] text-gray-400 truncate">
                  Search
                </div>
              </div>
            </button>
          </div>

          {/* Right: Wallet + Ranking */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* SOLANA WALLET STATUS ON MOBILE */}
            {connected && publicKey ? (
              <div className="flex items-center gap-1 bg-[#0D1520] border border-[#1E2D40] text-[#c7f284] px-2 py-1 rounded-full text-[11px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c7f284] animate-pulse" />
                <span>{shortAddress}</span>
                <button
                  onClick={async () => { await disconnectWallet() }}
                  className="ml-0.5 text-gray-400 hover:text-white transition-colors"
                  aria-label="Disconnect wallet"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : null}

            {/* Phosphor Ranking Icon */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-white hover:opacity-80 transition-opacity p-1"
              title="Leaderboard"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="20">
                <line x1="16" y1="216" x2="240" y2="216" />
                <rect x="24" y="136" width="56" height="80" rx="8" />
                <rect x="96" y="72" width="64" height="144" rx="8" />
                <rect x="176" y="160" width="56" height="56" rx="8" />
                <circle cx="128" cy="108" r="10" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Token Selector Modal */}
      <TokenSelector isOpen={showSelector} onClose={() => setShowSelector(false)} onSelect={handleSelectLiveToken} />

      {/* Connect Wallet Modal */}
      <ConnectWalletModal isOpen={isModalOpen} onClose={closeWalletModal} />

      {/* Mobile Sidebar Navigation */}
      <div
        className={`lg:hidden fixed inset-0 z-[100] transition-opacity duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          className={`absolute top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-[#0A1017] border-r border-[#1C2838] flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#1C2838]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="VRFD" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">VRFD</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 rounded-lg border border-[#1C2838] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#152030] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {sidebarLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-4 px-4 py-4 hover:bg-[#0F151E] transition-colors"
              >
                <div className={`mt-0.5 text-[#B7F34A]`}>
                  {getNavIcon(link.icon)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-[15px]">{link.label}</div>
                  {link.description && (
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">{link.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}