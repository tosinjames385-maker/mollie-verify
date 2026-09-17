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

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    setSubmissions(demoSubmissions)
    if (demoSubmissions.length > 0) {
      setSelectedSubmission(demoSubmissions[0])
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#4ADE80] border border-[#4ADE80]/40 bg-[#4ADE80]/10">
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
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#B7F34A] border border-[#B7F34A]/40 bg-[#B7F34A]/10">
      <span className="text-[10px]">⚡</span> Express
    </span>
  )

  const filters = [
    { key: 'all', label: 'All', count: filterCounts.all },
    { key: 'pending', label: 'Pending', count: filterCounts.pending },
    { key: 'approved', label: 'Approved', count: filterCounts.approved },
    { key: 'rejected', label: 'Rejected', count: filterCounts.rejected },
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
          <button className="text-xs font-semibold text-[#B7F34A] bg-[#111A24] border border-[#B7F34A]/30 px-3.5 py-1.5 rounded-lg shadow-sm">
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
          <div className="lg:col-span-4">
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
                  className="w-full bg-[#060A0E] border border-[#182432] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B7F34A]/60 transition-colors"
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
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                        filter === f.key
                          ? 'bg-[#18281D] text-[#4ADE80] border border-[#4ADE80]/30'
                          : 'text-gray-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {f.label} ({f.count})
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
                              sortBy === opt.key ? 'text-[#B7F34A] bg-[#162230]' : 'text-gray-400 hover:text-white hover:bg-[#162230]/50'
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
                ) : filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`w-full p-3 text-left rounded-xl transition-all cursor-pointer border ${
                        selectedSubmission?.id === submission.id
                          ? 'bg-[#0D151F] border-[#c7f284]/66 shadow-md ring-1 ring-[#c7f284]/30'
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
                              <span className="text-[11px] font-bold text-[#B7F34A]">
                                {submission.token.symbol[0]}
                              </span>
                            </div>
                          )}
                          {/* Green verification badge overlay on bottom right of avatar if verified */}
                          {submission.token.verified && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border border-[#090F16] rounded-full flex items-center justify-center text-black text-[7px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>

                        {/* Token Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 leading-tight">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-bold text-white text-xs truncate tracking-tight">
                                {submission.token.symbol}
                              </span>
                              {submission.token.verified && (
                                <svg className="w-3 h-3 text-[#4ADE80] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {getStatusBadge(submission.status)}
                              {submission.isExpress && getExpressBadge()}
                            </div>
                          </div>

                          {/* Address & Time */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono leading-tight mt-0.5">
                            <span className="truncate">{submission.token.mintAddress.slice(0, 4)}...{submission.token.mintAddress.slice(-4)}</span>
                            <button
                              onClick={(e) => handleCopyAddress(e, submission.token.mintAddress)}
                              className="text-gray-500 hover:text-white transition-colors"
                            >
                              {copiedAddress === submission.token.mintAddress ? (
                                <Check className="w-2.5 h-2.5 text-[#4ADE80]" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <span className="text-gray-600 font-sans">·</span>
                            <span className="text-gray-400 font-sans">{submission.token.timeAgo || '1d'}</span>
                          </div>

                          {/* Market Cap & Net Volume Stats */}
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 leading-tight mt-0.5">
                            <span>
                              MC <span className="text-gray-200 font-semibold">{submission.token.marketCap || '—'}</span>
                            </span>
                            <span className="text-gray-600">·</span>
                            <span>
                              NET <span className="text-[#4ADE80] font-semibold">{submission.token.netVolume || '—'}</span>
                            </span>
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

              {/* Pagination Controls */}
              <div className="mt-3 pt-3 border-t border-[#16212D] flex items-center justify-between text-xs text-gray-400 px-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40"
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="text-gray-400 font-medium">
                  {page} / {searchQuery ? '2' : '23'}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Details Panel (Desktop) */}
          <div className="hidden lg:block lg:col-span-8 space-y-4">
            {selectedSubmission ? (
              <>
                <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#16212D] relative border border-[#1F2E3E]">
                        {selectedSubmission.token.imageUrl ? (
                          <img
                            src={selectedSubmission.token.imageUrl}
                            alt={selectedSubmission.token.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1C2C3E] to-[#101924]">
                            <span className="text-lg font-bold text-[#B7F34A]">
                              {selectedSubmission.token.symbol[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-white">{selectedSubmission.token.symbol}</h2>
                          {getStatusBadge(selectedSubmission.status)}
                          {selectedSubmission.isExpress && getExpressBadge()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <span>{selectedSubmission.token.name}</span>
                          <span className="text-gray-600">·</span>
                          <span className="font-mono">{selectedSubmission.token.mintAddress.slice(0, 6)}...{selectedSubmission.token.mintAddress.slice(-6)}</span>
                          <button
                            onClick={(e) => handleCopyAddress(e, selectedSubmission.token.mintAddress)}
                            className="text-gray-500 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141E2A] hover:bg-[#1C2A3A] rounded-xl text-xs font-semibold text-gray-300 transition-colors border border-[#1F2E3E]">
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                  </div>

                  <div className="bg-[#060A0E] border border-[#16212D] rounded-xl p-3.5 flex items-start gap-3">
                    <Heart className="w-4 h-4 text-[#4ADE80] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">Help fast-track this submission</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Smart likes move pending submissions up the review queue. We periodically scan and add new smart likes accounts to our list from interactions on this site.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">SUBMISSION DETAILS</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Submitter X</span>
                        <span className="text-white font-medium">{selectedSubmission.submitterX || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Submitter wallet</span>
                        <span className="text-white font-mono">{selectedSubmission.submitterWallet ? `${selectedSubmission.submitterWallet.slice(0, 4)}...${selectedSubmission.submitterWallet.slice(-4)}` : '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Submitted</span>
                        <span className="text-white">16 Sep 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4 uppercase">METRICS</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">MC / FDV</p>
                        <p className="text-white font-semibold">{selectedSubmission.token.marketCap || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">NET VOLUME</p>
                        <p className="text-[#4ADE80] font-semibold">{selectedSubmission.token.netVolume || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-12 text-center text-gray-500 text-xs">
                Select a submission item to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}