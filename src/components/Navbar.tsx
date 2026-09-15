import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, BarChart2, Menu, X, MessageSquare, PlaySquare, HelpCircle, Code } from 'lucide-react'
import { searchTokens } from '../lib/api'

interface SearchResult {
  id: string
  name: string
  symbol: string
  mintAddress: string
  imageUrl?: string
}

export const Navbar = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      try {
        const results = await searchTokens(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } catch (error) {
        console.error('Search failed:', error)
      }
    }
    const debounce = setTimeout(performSearch, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleSelectToken = (mintAddress: string) => {
    navigate(`/token/${mintAddress}`)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  // Handle body scroll locking
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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#070A0F] border-b border-[#141B24] h-[68px] flex items-center">
        <div className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
            {/* Logo & Mobile Menu Toggle */}
            <div className="flex items-center gap-2 lg:gap-2.5 flex-shrink-0">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#101822] border border-[#1C2838] flex items-center justify-center p-1.5 overflow-hidden">
                   <svg className="w-full h-full text-[#00D2B8]" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                   </svg>
                </div>
                <span className="font-black text-white text-[17px] tracking-wide hidden lg:block">
                  MOLLIE
                </span>
              </Link>

              {/* Mobile Menu Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden w-8 h-8 rounded-md bg-[#091018] border border-[#215E9E] flex items-center justify-center text-gray-300 hover:text-white transition-colors"
              >
                <Menu className="w-4 h-4 text-[#4299E1]" />
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-7 text-sm font-semibold">
              <Link to="/submissions" className="text-gray-200 hover:text-white transition-colors">
                Submissions
              </Link>
              <Link to="/news" className="text-gray-200 hover:text-white transition-colors">
                News
              </Link>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">
                Media
              </a>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">
                FAQ
              </a>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">
                APIs
              </a>
            </div>

            {/* Search Bar - Fake input that opens modal */}
            <div className="flex-1 max-w-[130px] sm:max-w-sm md:max-w-md lg:max-w-xl relative">
              <div className="relative cursor-text" onClick={() => setShowResults(true)}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <div className="w-full bg-[#0F151E] border border-[#1A2332] rounded-full pl-9 pr-4 py-1.5 lg:py-2 text-xs lg:text-sm text-gray-500 hover:border-[#B7F34A] transition-colors flex items-center">
                  Search
                </div>
              </div>

              {/* Search Modal Backdrop & Dialog */}
              {showResults && (
                <div className="fixed inset-0 z-[120] flex justify-center sm:items-start sm:pt-24 items-start pt-4 px-2 sm:px-4 transition-opacity">
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResults(false)} />
                  
                  <div className="relative w-full max-w-[600px] bg-[#0A1017] border border-[#1C2838] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="p-4 border-b border-[#1C2838] relative flex items-center">
                      <Search className="absolute left-7 w-5 h-5 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Submit metadata and insights for a token"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#101822] border border-[#1C2838] rounded-lg pl-12 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#B7F34A] transition-colors"
                      />
                      <button 
                        onClick={() => setShowResults(false)}
                        className="absolute right-7 bg-[#1A2636] border border-[#2C3B4E] text-gray-400 text-[10px] font-bold px-2 py-1 rounded"
                      >
                        Esc
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400">Suggested tokens</div>
                      
                      <button className="w-full flex items-center justify-between px-3 py-3 hover:bg-[#152030] rounded-lg transition-colors group text-left">
                        <div className="flex items-center gap-3">
                          <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="SOL" className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1">SOL <div className="w-3.5 h-3.5 bg-[#B7F34A] rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div></div>
                            <div className="text-[11px] text-gray-400">Wrapped SOL</div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 group-hover:text-gray-300">
                          So11...1112 <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </div>
                      </button>

                      <button className="w-full flex items-center justify-between px-3 py-3 hover:bg-[#152030] rounded-lg transition-colors group text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2775CA] flex items-center justify-center text-white font-bold">$</div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1">USDC <div className="w-3.5 h-3.5 bg-[#B7F34A] rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div></div>
                            <div className="text-[11px] text-gray-400">USD Coin</div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 group-hover:text-gray-300">
                          EPjF...Dt1v <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </div>
                      </button>

                      {/* We could render real search results here if searchQuery is not empty */}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Analytics icon */}
              <button className="text-gray-400 hover:text-white transition-colors p-1 hidden sm:block">
                <BarChart2 className="w-4 h-4" />
              </button>
              
              <button className="text-gray-400 hover:text-white transition-colors p-1 sm:hidden">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
              </button>

              {/* Twitter / X icon */}
              <button className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </button>

              {/* Sign in with X Button */}
              <button className="bg-[#E4E4E6] hover:bg-white text-black font-extrabold text-[11px] lg:text-sm px-3 lg:px-5 py-1.5 lg:py-2 rounded-full flex items-center gap-1.5 shadow transition-colors">
                <span className="whitespace-nowrap">Sign in with</span>
                <svg className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Slider */}
      <div 
        className={`lg:hidden fixed inset-0 z-[100] transition-opacity duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)} 
        />
        
        {/* Sidebar Panel */}
        <div 
          className={`absolute top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-[#0A1017] border-r border-[#1C2838] p-5 flex flex-col transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="w-9 h-9 rounded-full bg-[#101822] border border-[#1C2838] flex items-center justify-center p-2 overflow-hidden">
               <svg className="w-full h-full text-[#00D2B8]" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
               </svg>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="w-9 h-9 rounded-xl border border-[#1C2838] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#152030] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-6 text-[15px] font-bold flex-1 overflow-y-auto pb-6">
             <Link to="/submissions" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 text-gray-200 hover:text-white group">
               <div className="mt-0.5 text-[#B7F34A]">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
               </div>
               <div>
                 <div className="mb-1">Submissions</div>
                 <div className="text-xs text-gray-500 font-medium leading-tight">View all verification and metadata update requests for tokens</div>
               </div>
             </Link>
             
             <Link to="/news" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 text-gray-200 hover:text-white group">
               <div className="mt-0.5 text-[#B7F34A]">
                 <MessageSquare className="w-5 h-5" />
               </div>
               <div>
                 <div className="mb-1">News</div>
                 <div className="text-xs text-gray-500 font-medium leading-tight">Recommend high signal tweets. VRFD moderates</div>
               </div>
             </Link>
             
             <a href="#" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-4 text-gray-200 hover:text-white group">
               <div className="mt-0.5 text-[#B7F34A]">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="14" y="2" width="6" height="20" rx="1"/><rect x="4" y="10" width="6" height="12" rx="1"/></svg>
               </div>
               <div>
                 <div className="mb-1">Leaderboard</div>
                 <div className="text-xs text-gray-500 font-medium leading-tight">Leaderboard: see the top signal generators on VRFD</div>
               </div>
             </a>
             
             <a href="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-200 hover:text-white group">
               <div className="text-[#B7F34A]">
                 <PlaySquare className="w-5 h-5" />
               </div>
               <div>Media</div>
             </a>
             
             <a href="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-200 hover:text-white group">
               <div className="text-[#B7F34A]">
                 <HelpCircle className="w-5 h-5" />
               </div>
               <div>FAQ</div>
             </a>
             
             <a href="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-gray-200 hover:text-white group">
               <div className="text-[#B7F34A]">
                 <Code className="w-5 h-5" />
               </div>
               <div>APIs</div>
             </a>
          </div>

          {/* Social Icons Bottom */}
          <div className="pt-6 border-t border-[#1C2838] grid grid-cols-5 gap-2 px-1 pb-2">
             <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
                <span className="text-[10px] font-medium">Twitter</span>
             </a>
             <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                <span className="text-[10px] font-medium">Discord</span>
             </a>
             <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.833.94z"/></svg>
                <span className="text-[10px] font-medium">Telegram</span>
             </a>
             <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.082 0 12 0 12s0 3.918.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.918 24 12 24 12s0-3.918-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                <span className="text-[10px] font-medium">YouTube</span>
             </a>
             <a href="#" className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.336-1.053 1.6.03.21.053.424.053.64 0 2.97-3.415 5.378-7.625 5.378-4.21 0-7.625-2.407-7.625-5.378 0-.216.023-.43.053-.64-.618-.264-1.053-.884-1.053-1.6 0-.968.786-1.754 1.754-1.754.477 0 .899.182 1.207.491 1.194-.856 2.85-1.418 4.674-1.488l.899-4.198c.05-.24.278-.41.523-.41.026 0 .052.002.079.006l2.956.623a1.248 1.248 0 0 1 1.144-.737zm-6.287 6.435c-1.02 0-1.848.828-1.848 1.848 0 1.02.828 1.848 1.848 1.848 1.02 0 1.848-.828 1.848-1.848 0-1.02-.828-1.848-1.848-1.848zm4.557 0c-1.02 0-1.848.828-1.848 1.848 0 1.02.828 1.848 1.848 1.848 1.02 0 1.848-.828 1.848-1.848 0-1.02-.828-1.848-1.848-1.848zm-2.278 5.768c-1.623 0-3.114-.492-4.15-1.341-.186-.151-.212-.423-.06-.608.151-.185.423-.212.608-.06.878.72 2.148 1.132 3.602 1.132 1.454 0 2.724-.411 3.602-1.131.185-.152.457-.126.608.06.152.185.126.457-.06.608-1.036.85-2.527 1.34-4.15 1.34z"/></svg>
                <span className="text-[10px] font-medium">Reddit</span>
             </a>
          </div>
        </div>
      </div>
    </>
  )
}
