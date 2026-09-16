import { useEffect, useState } from 'react'
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

  useEffect(() => {
    loadSubmissions()
  }, [filter])

  const loadSubmissions = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    const filtered = filter === 'all'
      ? demoSubmissions
      : filter === 'pending'
        ? demoSubmissions.filter(s => s.status === 'pending')
        : demoSubmissions.filter(s => s.status === filter)
    setSubmissions(filtered)
    if (filtered.length > 0 && !selectedSubmission) {
      setSelectedSubmission(filtered[0])
    }
    setLoading(false)
  }

  const handleCopyAddress = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success('Mint address copied!')
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const getStatusBadge = (status: string) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#1C2838] text-gray-300">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )

  const getExpressBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#B7F34A]/10 text-[#B7F34A] border border-[#B7F34A]/20">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      Express
    </span>
  )

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: `Pending (${demoSubmissions.filter(s => s.status === 'pending').length})` },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="min-h-screen bg-[#070A0F]">
      {/* Tabs */}
      <div className="px-4 pt-3">
        <div className="flex gap-2">
          <button className="text-sm font-semibold text-white bg-[#1C2838] px-4 py-2 rounded-lg">
            Token Verification
          </button>
          <button className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-4 py-2">
            Metadata Updates
          </button>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="lg:grid lg:grid-cols-12 lg:gap-4">
          {/* Left Panel - Token List */}
          <div className="lg:col-span-4">
            <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-[#1C2838]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-white">
                    Submissions{' '}
                    <span className="text-xs font-normal text-gray-500">(Last 30 days)</span>
                  </h2>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search token or address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#060C14] border border-[#1C2838] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B7F34A]/50 transition-colors"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-1.5 mb-2">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        filter === f.key
                          ? 'bg-[#1C2838] text-white'
                          : 'text-gray-400 hover:text-white hover:bg-[#1C2838]/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-medium tracking-wider">SORT</span>
                  <div className="relative flex-1">
                    <button className="w-full flex items-center justify-between bg-[#060C14] border border-[#1C2838] rounded-lg px-2.5 py-1.5 text-xs text-white">
                      <span>Newest</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Token List */}
              <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
                {loading ? (
                  <div className="p-3 space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-[#1C2838] rounded-full" />
                          <div className="flex-1">
                            <div className="h-3 bg-[#1C2838] rounded w-16 mb-1.5" />
                            <div className="h-2.5 bg-[#1C2838] rounded w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <button
                      key={submission.id}
                      onClick={() => setSelectedSubmission(submission)}
                      className={`w-full p-2.5 text-left hover:bg-[#0F151E] transition-colors border-b border-[#1C2838]/50 ${
                        selectedSubmission?.id === submission.id ? 'bg-[#0F151E] border-l-2 border-l-[#B7F34A]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Token Logo */}
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#1C2838] relative">
                          {submission.token.imageUrl ? (
                            <>
                              <img
                                src={submission.token.imageUrl}
                                alt={submission.token.name}
                                className="w-full h-full object-cover relative z-10"
                                onError={(e) => {
                                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                  const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement
                                  if (fallback) fallback.style.display = 'flex'
                                }}
                              />
                              <div
                                className="w-full h-full items-center justify-center bg-gradient-to-br from-[#B7F34A] to-[#00D2B8] absolute inset-0 z-0"
                                style={{ display: 'none' }}
                              >
                                <span className="text-xs font-bold text-white">
                                  {submission.token.symbol[0]}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B7F34A] to-[#00D2B8]">
                              <span className="text-xs font-bold text-white">
                                {submission.token.symbol[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Token Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm truncate">
                              {submission.token.symbol}
                            </span>
                            <div className="flex items-center gap-1">
                              {getStatusBadge(submission.status)}
                              {submission.isExpress && getExpressBadge()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                            <span className="font-mono truncate">{submission.token.mintAddress.slice(0, 4)}...{submission.token.mintAddress.slice(-4)}</span>
                            <button
                              onClick={(e) => handleCopyAddress(e, submission.token.mintAddress)}
                              className="text-gray-500 hover:text-white flex-shrink-0"
                            >
                              {copiedAddress === submission.token.mintAddress ? (
                                <Check className="w-2.5 h-2.5 text-[#B7F34A]" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <span className="text-gray-600">·</span>
                            <span className="flex-shrink-0">{submission.token.timeAgo}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                            <span className="text-gray-500">
                              MC <span className="text-gray-300 font-medium">{submission.token.marketCap || '—'}</span>
                            </span>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-500">
                              NET <span className="text-[#B7F34A] font-medium">{submission.token.netVolume || '—'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 text-xs">No submissions found</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="p-2.5 border-t border-[#1C2838] flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="text-xs text-gray-400">{page} / 22</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Details (hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-8 space-y-4">
            {selectedSubmission ? (
              <>
                {/* Token Header */}
                <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1C2838]">
                        {selectedSubmission.token.imageUrl ? (
                          <img
                            src={selectedSubmission.token.imageUrl}
                            alt={selectedSubmission.token.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                              ;(e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B7F34A] to-[#00D2B8] ${selectedSubmission.token.imageUrl ? 'hidden' : ''}`}>
                          <span className="text-xl font-bold text-white">
                            {selectedSubmission.token.symbol[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-white">{selectedSubmission.token.symbol}</h2>
                          {getStatusBadge(selectedSubmission.status)}
                          {selectedSubmission.isExpress && getExpressBadge()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <span>{selectedSubmission.token.name}</span>
                          <span>·</span>
                          <span className="font-mono text-xs">{selectedSubmission.token.mintAddress.slice(0, 4)}...{selectedSubmission.token.mintAddress.slice(-4)}</span>
                          <button
                            onClick={(e) => handleCopyAddress(e, selectedSubmission.token.mintAddress)}
                            className="text-gray-500 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <span>·</span>
                          <span className="text-gray-500">{selectedSubmission.token.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C2838] hover:bg-[#253545] rounded-lg text-sm text-gray-300 transition-colors">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  {/* Fast Track Banner */}
                  <div className="bg-[#060C14] border border-[#1C2838] rounded-lg p-3 flex items-start gap-3">
                    <Heart className="w-4 h-4 text-[#B7F34A] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">Help fast-track this submission</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Smart likes move pending submissions up the review queue. We periodically scan and add new smart likes accounts to our list from interactions on this site.
                      </p>
                    </div>
                    <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                      Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Submission Details */}
                  <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-5">
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4">SUBMISSION DETAILS</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Submitter X</span>
                        <span className="text-sm text-white font-medium flex items-center gap-1">
                          {selectedSubmission.submitterX}
                          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                          </svg>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Submitter wallet</span>
                        <span className="text-sm text-white font-mono text-xs">—</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Token X</span>
                        <span className="text-sm text-white font-medium flex items-center gap-1">
                          {selectedSubmission.tokenX}
                          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                          </svg>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Submitted</span>
                        <span className="text-sm text-white">16 Sep 2026, 14:51</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Last reviewed</span>
                        <span className="text-sm text-white">—</span>
                      </div>
                    </div>
                    <button className="mt-4 text-sm text-gray-400 hover:text-white flex items-center gap-1">
                      <ChevronRight className="w-4 h-4" />
                      SUBMITTER CONTEXT
                    </button>
                  </div>

                  {/* Metrics */}
                  <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-5">
                    <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4">METRICS</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">MC / FDV</p>
                        <p className="text-sm text-white">{selectedSubmission.metrics?.mcFdv || '— / —'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">24H VOL / NET</p>
                        <p className="text-sm text-white">{selectedSubmission.metrics?.vol24h || '—'} <span className="text-[#B7F34A]">/ {selectedSubmission.metrics?.netVolume || '—'}</span></p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">LIQUIDITY</p>
                        <p className="text-sm text-white">{selectedSubmission.metrics?.liquidity || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">ORGANIC SCORE</p>
                        <p className="text-sm text-white">{selectedSubmission.metrics?.organicScore || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">LIKES / SMART LIKES</p>
                        <p className="text-sm text-white">{selectedSubmission.metrics?.likesSmartLikes || '0 / 0'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-1">SMART FOLLOWERS</p>
                        <p className="text-sm text-white">{selectedSubmission.metrics?.smartFollowers || 0}</p>
                      </div>
                    </div>

                    {/* Jup Shield */}
                    <div className="mt-4 pt-4 border-t border-[#1C2838]">
                      <p className="text-[11px] text-gray-500 mb-2">JUP SHIELD</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedSubmission.jupShield || []).map((item, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1C2838] rounded-full text-xs text-gray-300">
                            <AlertTriangle className="w-3 h-3" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Log */}
                <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-5">
                  <h3 className="text-xs font-bold text-gray-500 tracking-wider mb-4">AUDIT LOG</h3>
                  <div className="space-y-3">
                    {(selectedSubmission.auditLog || []).map((log, i) => (
                      <div key={i} className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400 w-36">{log.date}</span>
                        <span className="text-white font-medium w-24">{log.action}</span>
                        <span className="text-gray-400">{log.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#0A1017] border border-[#1C2838] rounded-xl p-12 text-center">
                <p className="text-gray-500">Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}