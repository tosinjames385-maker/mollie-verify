import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, X, LogOut } from 'lucide-react'
import { TokenSelector } from './TokenSelector'
import { useAuth } from '../context/AuthContext'
import type { LiveToken } from '../services/tokenService'

export const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()
  const [showSelector, setShowSelector] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-40 bg-[#060B11]/95 backdrop-blur-md border-b border-[#141B24] h-[48px] items-center px-4">
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo & Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              {/* Exact Green/Cyan Sphere Globe VRFD Logo */}
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="46" stroke="url(#globeGrad)" strokeWidth="6" />
                  <path d="M15 50 Q50 20 85 50 Q50 80 15 50Z" stroke="url(#globeGrad)" strokeWidth="5" fill="none" />
                  <path d="M22 35 Q50 12 78 35" stroke="url(#globeGrad)" strokeWidth="4" fill="none" />
                  <path d="M22 65 Q50 88 78 65" stroke="url(#globeGrad)" strokeWidth="4" fill="none" />
                  <circle cx="30" cy="30" r="10" fill="#00D2B8" />
                  <path d="M26 30L29 33L35 27" stroke="#060B11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="globeGrad" x1="0" y1="0" x2="100" y2="100">
                      <stop offset="0%" stopColor="#00D2B8" />
                      <stop offset="100%" stopColor="#B7F34A" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </Link>

            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition-colors ${
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
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <div className="w-full bg-[#0A1017] border border-[#1C2838] rounded-full pl-10 pr-4 py-1.5 text-sm text-gray-400 flex items-center justify-between hover:border-gray-700 transition-colors">
                  <span>Search</span>
                  <kbd className="text-[10px] text-gray-500 bg-[#141E2C] px-1.5 py-0.5 rounded font-mono">/</kbd>
                </div>
              </div>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Phosphor Ranking Icon (ph--ranking-bold) */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-[#B7F34A] hover:opacity-90 transition-opacity p-1"
              title="Leaderboard"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
                <path d="M128 24a8 8 0 0 0-8 8v16H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16h-80V32a8 8 0 0 0-8-8Zm-72 80h48v96H56Zm64-40h48v136h-48Zm64 64h48v72h-48Z" />
              </svg>
            </button>

            {/* X Icon */}
            <button
              onClick={openAuthModal}
              className="text-gray-300 hover:text-white transition-colors p-1"
              title="Sign in with X"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </button>

            {/* X User Profile Badge Pill */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white px-2.5 py-1 rounded-full flex items-center gap-2 transition-all"
                >
                  <div className="relative w-6 h-6 rounded-full bg-[#0099FF] flex items-center justify-center text-white text-xs font-bold">
                    {user.username.charAt(0).toLowerCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00D2B8] border-2 border-[#0D1520] rounded-full" />
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0A1017] border border-[#1C2838] rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate(`/profile/${user.username}`)
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-[#1C2838] hover:text-white flex items-center gap-2"
                    >
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-[#1C2838] flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
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
        <div className="h-[48px] px-3 flex items-center justify-between gap-2">
          {/* Left: Sphere Logo + Hamburger Menu */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="46" stroke="url(#mobileGlobeGrad)" strokeWidth="6" />
                  <path d="M15 50 Q50 20 85 50 Q50 80 15 50Z" stroke="url(#mobileGlobeGrad)" strokeWidth="5" fill="none" />
                  <path d="M22 35 Q50 12 78 35" stroke="url(#mobileGlobeGrad)" strokeWidth="4" fill="none" />
                  <path d="M22 65 Q50 88 78 65" stroke="url(#mobileGlobeGrad)" strokeWidth="4" fill="none" />
                  <circle cx="30" cy="30" r="10" fill="#00D2B8" />
                  <path d="M26 30L29 33L35 27" stroke="#060B11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="mobileGlobeGrad" x1="0" y1="0" x2="100" y2="100">
                      <stop offset="0%" stopColor="#00D2B8" />
                      <stop offset="100%" stopColor="#B7F34A" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-[210px]">
            <button
              onClick={() => setShowSelector(true)}
              className="w-full text-left"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <div className="w-full bg-[#0A1017] border border-[#1C2838] rounded-full pl-8 pr-3 py-1.5 text-xs text-gray-400">
                  Search
                </div>
              </div>
            </button>
          </div>

          {/* Right: Ranking, X Icon, Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Phosphor Ranking Icon */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-[#B7F34A] hover:opacity-90 transition-opacity p-1"
              title="Leaderboard"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
                <path d="M128 24a8 8 0 0 0-8 8v16H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16h-80V32a8 8 0 0 0-8-8Zm-72 80h48v96H56Zm64-40h48v136h-48Zm64 64h48v72h-48Z" />
              </svg>
            </button>

            {/* X Icon */}
            <button
              onClick={openAuthModal}
              className="text-gray-300 hover:text-white transition-colors p-1"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </button>

            {/* X User Profile Badge Pill */}
            {isAuthenticated && user ? (
              <button
                onClick={() => navigate(`/profile/${user.username}`)}
                className="bg-[#0D1520] border border-[#1E2D40] text-white p-1 rounded-full flex items-center gap-1 transition-all"
              >
                <div className="relative w-6 h-6 rounded-full bg-[#0099FF] flex items-center justify-center text-white text-xs font-bold">
                  {user.username.charAt(0).toLowerCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#00D2B8] border border-[#0D1520] rounded-full" />
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="bg-[#F5F5F5] hover:bg-white text-black font-semibold text-[10px] px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
              >
                <span>Sign in with</span>
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      <TokenSelector isOpen={showSelector} onClose={() => setShowSelector(false)} onSelect={handleSelectLiveToken} />

      {/* Mobile Sidebar */}
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
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="50" fill="#00D2B8" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="#FFFFFF" strokeWidth="7" />
                  <circle cx="50" cy="62" r="4" fill="#FFFFFF" />
                  <rect x="46" y="32" width="8" height="20" rx="4" fill="#FFFFFF" />
                </svg>
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

          <div className="border-t border-[#1C2838] p-4">
            <div className="grid grid-cols-5 gap-2">
              <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
                <span className="text-[10px] font-medium">Twitter</span>
              </a>
              <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span className="text-[10px] font-medium">Discord</span>
              </a>
              <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.833.94z" />
                </svg>
                <span className="text-[10px] font-medium">Telegram</span>
              </a>
              <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.082 0 12 0 12s0 3.918.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.918 24 12 24 12s0-3.918-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="text-[10px] font-medium">YouTube</span>
              </a>
              <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.336-1.053 1.6.03.21.053.424.053.64 0 2.97-3.415 5.378-7.625 5.378-4.21 0-7.625-2.407-7.625-5.378 0-.216.023-.43.053-.64-.618-.264-1.053-.884-1.053-1.6 0-.968.786-1.754 1.754-1.754.477 0 .899.182 1.207.491 1.194-.856 2.85-1.418 4.674-1.488l.899-4.198c.05-.24.278-.41.523-.41.026 0 .052.002.079.006l2.956.623a1.248 1.248 0 0 1 1.144-.737zm-6.287 6.435c-1.02 0-1.848.828-1.848 1.848 0 1.02.828 1.848 1.848 1.848 1.02 0 1.848-.828 1.848-1.848 0-1.02-.828-1.848-1.848-1.848zm4.557 0c-1.02 0-1.848.828-1.848 1.848 0 1.02.828 1.848 1.848 1.848 1.02 0 1.848-.828 1.848-1.848 0-1.02-.828-1.848-1.848-1.848zm-2.278 5.768c-1.623 0-3.114-.492-4.15-1.341-.186-.151-.212-.423-.06-.608.151-.185.423-.212.608-.06.878.72 2.148 1.132 3.602 1.132 1.454 0 2.724-.411 3.602-1.131.185-.152.457-.126.608.06.152.185.126.457-.06.608-1.036.85-2.527 1.34-4.15 1.34z" />
                </svg>
                <span className="text-[10px] font-medium">Reddit</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}