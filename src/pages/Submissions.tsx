import { useEffect, useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, Heart, AlertTriangle, Share2, ChevronDown, Copy, Check } from 'lucide-react'
import { demoSubmissions, Submission } from '../data/demoSubmissions'
import toast from 'react-hot-toast'

export const Submissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter, searchQuery])

  const loadSubmissions = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Generate extra demo submissions to fill ~24 pages (240 items)
    const extraSymbols = [
      'ALPHA','BETA','GAMMA','DELTA','ZETA','THETA','KAPPA','SIGMA','OMEGA','PHI',
      'PSI','CHI','RHO','TAU','LAMBDA','MU','NU','XI','PI','EPSILON',
      'IOTA','VARON','SAFEX','LUNA','MARS','VENUS','SATURN','JUPITER','NEPTUNE','PLUTO',
      'CERES','HADES','ZEUS','POSEIDON','HERMES','ATHENA','APOLLO','ARTEMIS','HEPHAESTUS','ARES',
      'AFRODITE','DEMETER','HERA','DIONYSUS','PERSEPHONE','HADES','IRIS','HESTIA','PAN','NYX',
      'TITAN','CYCLOPS','MINOTAUR','CHIMERA','SPHYNX','GRIFFON','HYDRA','PEGASUS','UNICORN','DRAGON',
      'PHOENIX','KRAKEN','BASILISK','MANTICORE','CERBERUS','SCYLLA','CHARYBDIS','SIREN','HARPY','CENTAUR',
      'GOBLIN','ORC','ELF','DWARF','TROLL','OGRE','FAIRY','PIXIE','SPRITE','NYMPH',
      'DRUID','WIZARD','SORCERER','NECROMANCER','PALADIN','RANGER','ROGUE','BARD','CLERIC','MONK',
      'KNIGHT','WARRIOR','ARCHER','HUNTER','SHAMAN','PRIEST','WARLOCK','MAGE','ASSASSIN','BERSERKER',
      'SENTINEL','GUARDIAN','PROTECTOR','DEFENDER','CHAMPION','HERO','VILLAIN','LEGEND','MYTH','FABLE',
      'QUEST','VOYAGE','EXPEDITION','JOURNEY','ODYSSEY','CRUSADE','CAMPAIGN','ADVENTURE','DISCOVERY','EXPLORER',
      'PIONEER','SETTLER','PILGRIM','WANDERER','NOMAD','RANGER','SCOUT','PATHFINDER','TRAILBLAZER','EXPLORER',
      'NOVA','STELLAR','COSMIC','GALAXY','NEBULA','QUASAR','PULSAR','MAGNETAR','SPUTNIK','COMET',
      'ASTEROID','METEOR','ECLIPSE','SOLAR','LUNAR','STELLAR','ORBITAL','GRAVITY','QUANTUM','SINGULARITY',
      'PARADOX','ENIGMA','MYSTERY','PHANTOM','SHADOW','GHOST','SPECTER','WRAITH','SPIRIT','SOUL',
      'BLAZE','INFERNO','HELLFIRE','PYRO','IGNIS','EMBER','SCORCH','ASHES','SMOKE','FLAME',
      'FROST','ICE','GLACIER','TUNDRA','BLIZZARD','AVALANCHE','CRYO','Sleet','SNOW','HAIL',
      'STORM','TEMPEST','CYCLONE','TORNADO','HURRICANE','GALE','BREEZE','ZEPHYR','MONSOON','WHIRLWIND',
      'THUNDER','LIGHTNING','VOLT','SPARK','SHOCK','SURGE','PULSE','WAVE','RIPPLE','VIBRATION',
      'ECHO','RESONANCE','HARMONY','MELODY','SYMPHONY','concert','RHYTHM','TEMPO','BEAT','GROOVE',
      'PIXEL','VOXEL','BIT','BYTE','NODE','BLOCK','CHAIN','HASH','LEDGER','TOKEN',
      'COIN','STACK','VAULT','CHEST','SAFE','CACHE','DEPOT','CACHE','POOL','RESERVE',
      'NEXUS','CORE','HEART','PULSE','SPINE','BRAIN','MIND','SOUL','SPIRIT','ESSENCE',
    ]
    const statuses = ['pending','pending','pending','pending','pending','pending','pending','pending','approved','rejected']
    const timeAgos = ['1h','2h','3h','5h','8h','12h','1d','2d','3d','5d','7d','14d','21d','30d']
    const mcs = ['—','$5K','$12K','$34K','$67K','$89K','$123K','$234K','$456K','$789K','$1.2M','$2.5M','$5.6M']
    const nets = ['—','B:$500','B:$1.2K','B:$3.4K','B:$8.9K','B:$15K','B:$23K','B:$45K','B:$78K','B:$134K','B:$234K','S:$5K','S:$12K']

    const generated: Submission[] = extraSymbols.map((sym, i) => ({
      id: `gen-${i + 52}`,
      submissionType: 'verification',
      status: statuses[i % statuses.length],
      isExpress: i % 7 === 0,
      submitterWallet: `${sym.slice(0,4).toLowerCase()}${i}xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`,
      submitterX: `@${sym}`,
      tokenX: `@${sym}`,
      createdAt: new Date(Date.now() - (i * 3600000 * 6)).toISOString(),
      token: {
        name: sym.charAt(0) + sym.slice(1).toLowerCase() + ' Token',
        symbol: sym,
        mintAddress: `${sym}${i}KxLm${(i*7)%9}pQrS${(i*3)%9}tUv${(i*5)%9}wYz${(i*2)%9}dC6eGhAaBbOoIiCcDd${i%10}${sym.slice(0,3).toLowerCase()}`,
        imageUrl: i % 4 === 0 ? undefined : i % 3 === 0 ? `https://unavatar.io/${sym.toLowerCase()}?fallback=https://api.dicebear.com/7.x/avataaars/svg?seed=${sym}` : `https://api.dicebear.com/7.x/identicon/svg?seed=${sym}${i}`,
        marketCap: mcs[i % mcs.length],
        netVolume: nets[i % nets.length],
        timeAgo: timeAgos[i % timeAgos.length],
      },
    }))

    const all = [...demoSubmissions, ...generated]
    setSubmissions(all)
    if (all.length > 0) {
      setSelectedSubmission(all[0])
    }
    setLoading(false)
  }

  const filteredSubmissions = useMemo(() => {
    let result = submissions

    if (filter === 'pending') {
      result = result.filter(s => s.status === 'pending')
    } else if (filter === 'approved') {
      result = result.filter(s => s.status === 'approved')
    } else if (filter === 'rejected') {
      result = result.filter(s => s.status === 'rejected')
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.token.symbol.toLowerCase().includes(query) ||
        s.token.name.toLowerCase().includes(query) ||
        s.token.mintAddress.toLowerCase().includes(query)
      )
    }

    return result
  }, [submissions, filter, searchQuery])

  const isSearching = searchQuery.trim().length > 0

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredSubmissions.length / 10)), [filteredSubmissions])

  const displaySubmissions = useMemo(() => {
    if (isSearching) return filteredSubmissions
    const start = (page - 1) * 10
    return filteredSubmissions.slice(start, start + 10)
  }, [filteredSubmissions, page, isSearching])

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(p => p + 1)
      const nextPageStart = page * 10
      if (filteredSubmissions[nextPageStart]) {
        setSelectedSubmission(filteredSubmissions[nextPageStart])
      }
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1)
      const prevPageStart = (page - 2) * 10
      if (filteredSubmissions[prevPageStart]) {
        setSelectedSubmission(filteredSubmissions[prevPageStart])
      }
    }
  }

  const filterCounts = useMemo(() => ({
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }), [submissions])

  const handleCopyAddress = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success('Mint address copied!')
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#c7f284] border border-[#c7f284]/40 bg-[#c7f284]/10">
          <span className="text-[10px]">✓</span> Approved
        </span>
      )
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#F87171] border border-[#F87171]/40 bg-[#F87171]/10">
          <span className="text-[10px]">✕</span> Rejected
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-gray-300 border border-gray-700 bg-gray-900/60">
        <span className="text-[10px]">•</span> Pending
      </span>
    )
  }

  const getExpressBadge = () => (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#c7f284] border border-[#c7f284]/40 bg-[#c7f284]/10">
      <span className="text-[10px]">⚡</span> Express
    </span>
  )

  const filters = [
    { key: 'all', label: 'All', count: filterCounts.all },
    { key: 'pending', label: 'Pending', count: filterCounts.pending },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  const sortOptions = [
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
    { key: 'marketCap', label: 'Market Cap' },
  ]

  return (
    <div className="min-h-screen bg-[#06090E] text-white">
      {/* Top Tabs */}
      <div className="px-4 pt-4 pb-2 border-b border-[#131B26]/60">
        <div className="flex gap-4">
          <button className="text-xs font-semibold text-[#c7f284] bg-transparent border border-[#c7f28466] px-3.5 py-1.5 rounded-lg shadow-sm">
            Token Verification
          </button>
          <button className="text-xs font-medium text-gray-400 hover:text-white transition-colors px-2 py-1.5">
            Metadata Updates
          </button>
        </div>
      </div>

      <div className="p-3 md:p-4 max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-5">
          {/* Main List Container */}
          <div className={`lg:col-span-4 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl overflow-hidden p-3 md:p-4 shadow-xl">
              {/* Header */}
              <div className="mb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Submissions <span className="text-xs font-normal text-gray-500">(Last 30 days)</span>
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search token or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#060A0E] border border-[#182432] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c7f284]/60 transition-colors"
                />
              </div>

              {/* Search Results Header indicator if query exists */}
              {searchQuery.trim() && (
                <div className="mb-2 text-xs font-semibold text-gray-400 px-1">
                  Search results
                </div>
              )}

              {/* Filters */}
              {!searchQuery.trim() && (
                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar pb-1">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                        filter === f.key
                          ? 'bg-[#182418] text-[#c7f284]'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                    </button>
                  ))}
                </div>
              )}

              {/* Sort Dropdown */}
              {!searchQuery.trim() && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">SORT</span>
                  <div className="relative flex-1">
                    <button
                      onClick={() => setSortOpen(!sortOpen)}
                      className="w-full flex items-center justify-between bg-[#060A0E] border border-[#182432] rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
                    >
                      <span>{sortOptions.find(s => s.key === sortBy)?.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sortOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D151F] border border-[#1D2B3A] rounded-lg shadow-xl z-50 py-1">
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => { setSortBy(opt.key); setSortOpen(false) }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                              sortBy === opt.key ? 'text-[#c7f284] bg-[#162230]' : 'text-gray-400 hover:text-white hover:bg-[#162230]/50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token List */}
              <div className="space-y-1.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-0.5">
                {loading ? (
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse bg-[#0D141C] border border-[#16212D] rounded-xl p-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#16212D] rounded-full" />
                          <div className="flex-1">
                            <div className="h-3 bg-[#16212D] rounded w-20 mb-1.5" />
                            <div className="h-2 bg-[#16212D] rounded w-28" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displaySubmissions.length > 0 ? (
                  displaySubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => { setSelectedSubmission(submission); setShowMobileDetail(true) }}
                      className={`w-full p-3 text-left rounded-xl transition-all cursor-pointer border ${
                        selectedSubmission?.id === submission.id
                          ? 'bg-[#0D151F] border-[#c7f28466]'
                          : 'bg-[#090F16] border-[#131D28] hover:border-[#1F2E3E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Token Icon */}
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#16212D]">
                          {submission.token.imageUrl ? (
                            <img
                              src={submission.token.imageUrl}
                              alt={submission.token.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${submission.token.symbol}`
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1C2C3E] to-[#101924]">
                               <span className="text-[11px] font-bold text-[#c7f284]">
                                ?
                              </span>
                            </div>
                          )}
                          {/* Green verification badge overlay on bottom right of avatar if verified */}
                          {submission.token.verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#c7f284] border-2 border-[#090F16] rounded-full flex items-center justify-center text-black">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                                <path d="M10 14.5a4 4 0 1 1 5.5-5.5" />
                                <path d="M14 10.5 9.5 15" />
                                <path d="M9.5 15a4 4 0 1 1-5.5-5.5l4.5-4.5a4 4 0 1 1 5.5 5.5Z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Token Details Container */}
                        <div className="flex-1 flex justify-between items-center gap-2 min-w-0">
                          {/* Left Column */}
                          <div className="flex flex-col justify-center min-w-0 flex-1">
                            {/* Top Line: Name */}
                            <div className="font-bold text-white text-xs truncate tracking-tight mb-0.5">
                              {submission.token.symbol}
                            </div>
                            
                            {/* Middle Line: Address & Time */}
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono leading-tight mb-0.5">
                              <span className="truncate">{submission.token.mintAddress.slice(0, 4)}...{submission.token.mintAddress.slice(-4)}</span>
                              <button
                                onClick={(e) => handleCopyAddress(e, submission.token.mintAddress)}
                                className="text-gray-500 hover:text-white transition-colors"
                              >
                                {copiedAddress === submission.token.mintAddress ? (
                                  <Check className="w-2.5 h-2.5 text-[#c7f284]" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                              <span className="text-gray-600 font-sans">·</span>
                              <span className="text-gray-400 font-sans">{submission.token.timeAgo || '1d'}</span>
                            </div>
                            
                            {/* Bottom Line: Market Cap & Net Volume Stats */}
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 leading-tight">
                              <span>
                                MC <span className="text-gray-200 font-semibold">{submission.token.marketCap || '—'}</span>
                              </span>
                              <span className="text-gray-600">·</span>
                              <span>
                                NET <span className="text-[#c7f284] font-semibold">{submission.token.netVolume || '—'}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Right Column: Status Pill */}
                          <div className="flex-shrink-0 self-center">
                            {getStatusBadge(submission.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-[#090F16] border border-[#131D28] rounded-xl">
                    <p className="text-gray-500 text-xs">No submissions matching your filter</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls - hidden when searching */}
              {!isSearching && (
              <div className="mt-3 pt-3 border-t border-[#16212D] flex items-center justify-between text-xs text-gray-400 px-1">
                <button
                  onClick={handlePrevPage}
                  className="hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40"
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="text-gray-400 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  className="hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40"
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Right Details Panel */}
          <div className={`lg:col-span-8 space-y-4 ${showMobileDetail ? 'block' : 'hidden lg:block'}`}>
            {selectedSubmission ? (
              <>
                <button 
                  onClick={() => setShowMobileDetail(false)}
                  className="lg:hidden flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors pb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to list
                </button>
                {/* Token Header Card */}
                <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[#16212D] relative border border-[#1F2E3E] flex-shrink-0">
                      {selectedSubmission.token.imageUrl ? (
                        <img
                          src={selectedSubmission.token.imageUrl}
                          alt={selectedSubmission.token.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedSubmission.token.symbol}`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1C2C3E] to-[#101924]">
                          <span className="text-xl font-bold text-[#c7f284]">
                            ?
                          </span>
                        </div>
                      )}
                      {selectedSubmission.token.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#c7f284] border-2 border-[#0B1118] rounded-full flex items-center justify-center text-black">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <path d="M10 14.5a4 4 0 1 1 5.5-5.5" />
                            <path d="M14 10.5 9.5 15" />
                            <path d="M9.5 15a4 4 0 1 1-5.5-5.5l4.5-4.5a4 4 0 1 1 5.5 5.5Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Top Row: Title, Badges & Share */}
                      <div className="flex items-start justify-between gap-2 w-full mb-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0 mt-0.5">
                          <h2 className="text-xl font-bold text-white tracking-tight">{selectedSubmission.token.symbol}</h2>
                          {getStatusBadge(selectedSubmission.status)}
                          {selectedSubmission.isExpress && getExpressBadge()}
                        </div>
                        <button className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#141E2A] hover:bg-[#1C2A3A] rounded-lg text-xs font-semibold text-gray-300 transition-colors border border-[#1F2E3E]">
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                      </div>

                      {/* Bottom Row: Name, Mint, Time */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                        <span className="truncate max-w-[80px] sm:max-w-none">{selectedSubmission.token.name}</span>
                        <span className="text-gray-600">·</span>
                        <span className="font-mono">{selectedSubmission.token.mintAddress.slice(0, 4)}...{selectedSubmission.token.mintAddress.slice(-4)}</span>
                        <button
                          onClick={(e) => handleCopyAddress(e, selectedSubmission.token.mintAddress)}
                          className="text-gray-500 hover:text-white"
                        >
                          {copiedAddress === selectedSubmission.token.mintAddress ? (
                            <Check className="w-3 h-3 text-[#c7f284]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-gray-600">·</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                             <circle cx="12" cy="12" r="10" />
                             <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {selectedSubmission.token.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fast Track Banner */}
                  <div className="bg-[#060A0E] border border-[#16212D] rounded-xl p-4 flex items-start gap-3">
                    <Heart className="w-5 h-5 text-[#c7f284] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">Help fast-track this submission</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Smart likes move pending submissions up the review queue. We periodically scan and add new smart likes accounts to our list from interactions on this site.
                      </p>
                    </div>
                    <button className="text-sm font-semibold text-[#c7f284] hover:underline flex items-center gap-1 flex-shrink-0">
                      Dashboard <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submission Details Card */}
                <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">SUBMISSION DETAILS</h3>
                  <div className="space-y-0 text-sm">
                    <div className="flex items-center justify-between py-3 border-b border-[#16212D]/50">
                      <span className="text-gray-400">Submitter X</span>
                      <span className="text-white font-medium flex items-center gap-1.5">
                        {selectedSubmission.submitterX || '—'}
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-[#16212D]/50">
                      <span className="text-gray-400">Submitter wallet</span>
                      <span className="text-white font-mono text-xs">
                        {selectedSubmission.submitterWallet ? `${selectedSubmission.submitterWallet.slice(0, 4)}...${selectedSubmission.submitterWallet.slice(-4)}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-[#16212D]/50">
                      <span className="text-gray-400">Token X</span>
                      <span className="text-white font-medium flex items-center gap-1.5">
                        {selectedSubmission.tokenX || '—'}
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-[#16212D]/50">
                      <span className="text-gray-400">Submitted</span>
                      <span className="text-white">{new Date(selectedSubmission.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(selectedSubmission.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-400">Last reviewed</span>
                      <span className="text-white">{selectedSubmission.status === 'approved' ? '16 Sep 2026, 13:03' : selectedSubmission.status === 'rejected' ? '16 Sep 2026, 11:20' : '—'}</span>
                    </div>
                  </div>

                  <button className="mt-3 text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                    SUBMITTER CONTEXT
                  </button>
                </div>

                {/* Metrics Card */}
                <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                  <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">METRICS</h3>
                  <div className="grid grid-cols-2 gap-5 text-sm">
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1 font-semibold uppercase tracking-wide">MC / FDV</p>
                      <p className="text-white font-bold">
                        {selectedSubmission.token.marketCap || '—'} / {selectedSubmission.token.marketCap || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1 font-semibold uppercase tracking-wide">24H VOL / NET</p>
                      <p className="text-white font-bold">
                        {selectedSubmission.metrics?.vol24h || '—'} / <span className="text-[#c7f284]">{selectedSubmission.token.netVolume || '—'}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1 font-semibold uppercase tracking-wide">LIQUIDITY</p>
                      <p className="text-white font-bold">{selectedSubmission.metrics?.liquidity || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1 font-semibold uppercase tracking-wide">ORGANIC SCORE</p>
                      <p className="text-white font-bold">{selectedSubmission.metrics?.organicScore || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1 font-semibold uppercase tracking-wide">LIKES / SMART LIKES</p>
                      <p className="text-white font-bold">{selectedSubmission.metrics?.likesSmartLikes || '—'}</p>
                    </div>
                  </div>

                  {selectedSubmission.jupShield && selectedSubmission.jupShield.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#16212D]">
                      <p className="text-[11px] text-gray-500 mb-2 font-semibold">JUP SHIELD</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSubmission.jupShield.map((item, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2A] rounded-full text-xs text-gray-300 border border-[#1F2E3E]">
                            <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Log */}
                {selectedSubmission.auditLog && selectedSubmission.auditLog.length > 0 && (
                  <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">AUDIT LOG</h3>
                    <div className="space-y-3">
                      {selectedSubmission.auditLog.map((log, i) => (
                        <div key={i} className="flex items-start gap-4 text-sm">
                          <span className="text-gray-500 w-40 flex-shrink-0">{log.date}</span>
                          <span className="text-white font-semibold w-24 flex-shrink-0">{log.action}</span>
                          <span className="text-gray-400">{log.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-12 text-center text-gray-500 text-xs">
                Select a submission item to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Detail View */}
      {showMobileDetail && selectedSubmission && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#06090E] overflow-y-auto">
          <div className="p-4">
            {/* Back button */}
            <button
              onClick={() => setShowMobileDetail(false)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to list
            </button>

            {/* Token Header */}
            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#16212D] relative border border-[#1F2E3E]">
                    {selectedSubmission.token.imageUrl ? (
                      <img
                        src={selectedSubmission.token.imageUrl}
                        alt={selectedSubmission.token.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedSubmission.token.symbol}`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1C2C3E] to-[#101924]">
                        <span className="text-lg font-bold text-[#c7f284]">
                          {selectedSubmission.token.symbol[0]}
                        </span>
                      </div>
                    )}
                    {selectedSubmission.token.verified && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#c7f284] border-2 border-[#0B1118] rounded-full flex items-center justify-center text-black text-[8px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedSubmission.token.symbol}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedSubmission.status)}
                      {selectedSubmission.isExpress && getExpressBadge()}
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141E2A] hover:bg-[#1C2A3A] rounded-xl text-xs font-semibold text-gray-300 transition-colors border border-[#1F2E3E]">
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{selectedSubmission.token.name}</span>
                <span className="text-gray-600">·</span>
                <span className="font-mono">{selectedSubmission.token.mintAddress.slice(0, 4)}...{selectedSubmission.token.mintAddress.slice(-4)}</span>
                <button
                  onClick={(e) => handleCopyAddress(e, selectedSubmission.token.mintAddress)}
                  className="text-gray-500 hover:text-white"
                >
                  {copiedAddress === selectedSubmission.token.mintAddress ? (
                    <Check className="w-3 h-3 text-[#c7f284]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <span className="text-gray-600">·</span>
                <span className="flex items-center gap-1">
                  <span>🕐</span>
                  {selectedSubmission.token.timeAgo}
                </span>
              </div>
            </div>

            {/* Fast Track Banner */}
            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 mb-4 flex items-start gap-3">
              <Heart className="w-5 h-5 text-[#c7f284] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Help fast-track this submission</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Smart likes move pending submissions up the review queue. We periodically scan and add new smart likes accounts to our list from interactions on this site.
                </p>
              </div>
              <button className="text-sm font-semibold text-[#c7f284] hover:underline flex items-center gap-1 flex-shrink-0">
                Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Submission Details */}
            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 mb-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">SUBMISSION DETAILS</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-[#16212D]/50">
                  <span className="text-gray-400">Submitter X</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {selectedSubmission.submitterX || '—'}
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#16212D]/50">
                  <span className="text-gray-400">Submitter wallet</span>
                  <span className="text-white font-mono text-xs">
                    {selectedSubmission.submitterWallet ? `${selectedSubmission.submitterWallet.slice(0, 4)}...${selectedSubmission.submitterWallet.slice(-4)}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#16212D]/50">
                  <span className="text-gray-400">Token X</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {selectedSubmission.tokenX || '—'}
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#16212D]/50">
                  <span className="text-gray-400">Submitted</span>
                  <span className="text-white">{new Date(selectedSubmission.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(selectedSubmission.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400">Last reviewed</span>
                  <span className="text-white">{selectedSubmission.status === 'approved' ? '16 Sep 2026, 13:03' : selectedSubmission.status === 'rejected' ? '16 Sep 2026, 11:20' : '—'}</span>
                </div>
              </div>

              <button className="mt-3 text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
                SUBMITTER CONTEXT
              </button>
            </div>

            {/* Metrics */}
            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 mb-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">METRICS</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">MC / FDV</p>
                  <p className="text-white font-semibold">{selectedSubmission.token.marketCap || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">NET VOLUME</p>
                  <p className="text-[#c7f284] font-semibold">{selectedSubmission.token.netVolume || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">24H VOL</p>
                  <p className="text-white font-semibold">{selectedSubmission.metrics?.vol24h || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">LIQUIDITY</p>
                  <p className="text-white font-semibold">{selectedSubmission.metrics?.liquidity || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">ORGANIC SCORE</p>
                  <p className="text-white font-semibold">{selectedSubmission.metrics?.organicScore || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">LIKES / SMART LIKES</p>
                  <p className="text-white font-semibold">{selectedSubmission.metrics?.likesSmartLikes || '—'}</p>
                </div>
              </div>

              {/* Jup Shield */}
              {selectedSubmission.jupShield && selectedSubmission.jupShield.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#16212D]">
                  <p className="text-[11px] text-gray-500 mb-2 font-semibold">JUP SHIELD</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.jupShield.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2A] rounded-full text-xs text-gray-300 border border-[#1F2E3E]">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audit Log */}
            {selectedSubmission.auditLog && selectedSubmission.auditLog.length > 0 && (
              <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 mb-6">
                <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">AUDIT LOG</h3>
                <div className="space-y-3">
                  {selectedSubmission.auditLog.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <span className="text-gray-500 w-32 flex-shrink-0">{log.date}</span>
                      <span className="text-white font-semibold w-20 flex-shrink-0">{log.action}</span>
                      <span className="text-gray-400">{log.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}