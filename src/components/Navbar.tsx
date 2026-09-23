import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, X, ChevronDown, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { TokenSelector } from './TokenSelector'
import { WalletConnectControl } from './WalletConnectControl'
import { useAuth } from '../context/AuthContext'
import type { LiveToken } from '../services/tokenService'

const XLogo = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
)

const SignInWithXButton = ({
  onClick,
  compact = false,
}: {
  onClick: () => void
  compact?: boolean
}) => (
  <button
    onClick={onClick}
    aria-label="Sign in with X"
    className={`bg-[#F3EEE4] hover:bg-[#EBE4D6] text-[#111111] font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-sm ${
      compact ? 'text-[11px] px-2.5 py-[6px]' : 'text-xs px-3.5 py-1.5'
    }`}
  >
    <span>Sign in with</span>
    <XLogo className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
  </button>
)

export const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()

  const [showSelector, setShowSelector] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSelectLiveToken = (token: { symbol: string; name: string; mintAddress: string; logo?: string; verified?: boolean }) => {
    setShowSelector(false)
    const selectedToken: LiveToken = {
      id: token.mintAddress,
      chain: 'solana',
      name: token.name,
      symbol: token.symbol,
      mintAddress: token.mintAddress,
      logo: token.logo || null,
      decimals: 9,
      verified: Boolean(token.verified),
    }
    navigate(`/token/${token.mintAddress}`, { state: { selectedToken } })
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
    const color = 'text-[#c7f284]'
    switch (icon) {
      case 'checkmark':
        return (
          <svg className={`w-5 h-5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      case 'chart':
        return (
          <svg className={`w-5 h-5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 18h16M7 18v-5M12 18V9M17 18v-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6l.01.01" strokeLinecap="round" strokeWidth="3" />
          </svg>
        )
      case 'play':
        return (
          <svg className={`w-5 h-5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        )
      case 'help':
        return (
          <svg className={`w-5 h-5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      case 'code':
        return <span className={`text-lg font-mono ${color}`}>&lt;/&gt;</span>
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

            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:opacity-80 transition-opacity p-1"
              title="X"
            >
              <XLogo className="w-4 h-4" />
            </a>

            <WalletConnectControl variant="compact" />

            {isAuthenticated && user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white px-2.5 py-1 rounded-full flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <div className="relative w-6 h-6 rounded-full bg-[#0099FF] flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.username.charAt(0).toLowerCase()
                      )}
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
              </>
            ) : (
              <SignInWithXButton onClick={openAuthModal} />
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
          <div className="min-w-0 flex-1">
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

          {/* Right: Ranking + X / Sign in */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
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

            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:opacity-80 transition-opacity p-1"
              title="X"
            >
              <XLogo className="w-3.5 h-3.5" />
            </a>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen)
                    setMobileMenuOpen(false)
                  }}
                  className="bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white pl-1 pr-1.5 py-0.5 rounded-full flex items-center gap-1 transition-all"
                >
                  <div className="relative w-6 h-6 rounded-full bg-[#0099FF] overflow-hidden flex items-center justify-center text-white text-xs font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.username.charAt(0).toLowerCase()
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00D2B8] border-2 border-[#0D1520] rounded-full" />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-44 bg-[#0F1722] border border-[#1C2A3A] rounded-2xl shadow-2xl p-1.5 z-50">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate(`/profile/${user.username}`)
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-gray-200 hover:text-white hover:bg-[#1A2636] rounded-xl"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <SignInWithXButton onClick={openAuthModal} compact />
            )}
          </div>
        </div>
      </nav>

      {/* Token Selector Modal */}
      <TokenSelector isOpen={showSelector} onClose={() => setShowSelector(false)} onSelect={handleSelectLiveToken} />

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
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="VRFD" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 rounded-lg border border-[#2A3644] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#152030] transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sidebarLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-4 px-4 py-4 hover:bg-[#0F151E] transition-colors"
              >
                <div className="mt-0.5">
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

          <div className="border-t border-[#1C2838] px-3 py-4">
            <div className="grid grid-cols-5 gap-1">
              {[
                {
                  label: 'Twitter',
                  href: 'https://x.com',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                    </svg>
                  ),
                },
                {
                  label: 'Discord',
                  href: 'https://discord.com',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  ),
                },
                {
                  label: 'Telegram',
                  href: 'https://t.me',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.9 4.5 2.8 11.8c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.2-7.1c.5-.3 1-.1.6.2l-9 8.2-.3 4.4c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.8l3.3-15.5c.3-1.3-.5-1.9-1.5-1.6z" />
                    </svg>
                  ),
                },
                {
                  label: 'YouTube',
                  href: 'https://youtube.com',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12 9.6 15.5z" />
                    </svg>
                  ),
                },
                {
                  label: 'Reddit',
                  href: 'https://reddit.com',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14.2 3.2 15 7.8a4.6 4.6 0 0 1 3.1 1.4 2.3 2.3 0 1 1-.6 3.3 7.6 7.6 0 0 1-5.5 2.3 7.6 7.6 0 0 1-5.5-2.3 2.3 2.3 0 1 1-.6-3.3 4.6 4.6 0 0 1 3.1-1.4l.8-4.6 3.4.3zm-2.2 12.6c1.4 0 2.6-.3 3.4-.7-.2 1.4-1.6 2.5-3.4 2.5s-3.2-1.1-3.4-2.5c.8.4 2 .7 3.4.7z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors py-1"
                >
                  {item.icon}
                  <span className="text-[10px] leading-none">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}