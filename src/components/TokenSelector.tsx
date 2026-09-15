import { useEffect, useState, useRef, useCallback } from 'react'
import { Search, X, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPopularTokens, searchTokens, LiveToken } from '../services/tokenService'

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: LiveToken) => void
}

function shortenMint(mint: string) {
  if (mint.length <= 8) return mint
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`
}

// Reusable row – keeps mintAddress as unique key
const TokenRow = ({
  token,
  onSelect,
}: {
  token: LiveToken
  onSelect: (t: LiveToken) => void
}) => {
  const [imgError, setImgError] = useState(false)
  const copyMint = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(token.mintAddress)
    toast.success('Mint address copied')
  }
  return (
    <button
      onClick={() => onSelect(token)}
      className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#0D141E] hover:bg-[#111A25] active:bg-[#0A121A] active:scale-[0.99] border border-[#1C2838]/60 hover:border-[#1E2D40] rounded-[8px] text-left transition-all h-[48px] group"
    >
      {/* Logo 22px */}
      <div className="w-8 h-8 rounded-full bg-[#070A0F] border border-[#1C2838] flex items-center justify-center overflow-hidden flex-shrink-0">
        {!imgError && token.logo ? (
          <img
            src={token.logo}
            alt={token.symbol}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-[11px] font-bold text-[#94A3B8]">{token.symbol.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-white truncate">{token.symbol}</span>
          {token.verified && (
            <span className="w-3.5 h-3.5 bg-[#B7F34A] rounded-full flex items-center justify-center flex-shrink-0" title="Verified">
              <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#64748B] truncate leading-none mt-0.5">{token.name}</div>
        <div className="text-[11px] text-[#4A5C75] font-mono truncate leading-none mt-0.5">{shortenMint(token.mintAddress)}</div>
      </div>
      <span
        onClick={copyMint}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            copyMint(e as any)
          }
        }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#1A2332] transition-colors flex-shrink-0"
        title="Copy mint address"
      >
        <Copy className="w-3.5 h-3.5" />
      </span>
    </button>
  )
}

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0D141E] border border-[#1C2838]/40 rounded-[8px] h-[48px] animate-pulse">
    <div className="w-8 h-8 rounded-full bg-[#1C2838]" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-[#1C2838] rounded w-16" />
      <div className="h-2.5 bg-[#152030] rounded w-24" />
      <div className="h-2.5 bg-[#152030] rounded w-20" />
    </div>
  </div>
)

export const TokenSelector = ({ isOpen, onClose, onSelect }: TokenSelectorProps) => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [tokens, setTokens] = useState<LiveToken[]>([])
  const [popular, setPopular] = useState<LiveToken[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const listRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Lock scroll + ESC
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setDebouncedQuery('')
      setPage(1)
      setError(null)
    }
  }, [isOpen])

  // Fetch popular on open (suggested)
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const loadPopular = async () => {
      try {
        const p = await getPopularTokens()
        if (!cancelled) setPopular(p)
      } catch (e) {
        console.warn('popular failed', e)
      }
    }
    loadPopular()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Fetch tokens – debounced query, page
  const fetchPage = useCallback(
    async (q: string, p: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        setError(null)
        const res = await searchTokens(q, p, 20)
        if (append) {
          setTokens((prev) => {
            // dedupe by mintAddress
            const seen = new Set(prev.map((t) => t.mintAddress))
            const next = [...prev]
            for (const t of res.tokens) {
              if (!seen.has(t.mintAddress)) next.push(t)
            }
            return next
          })
        } else {
          setTokens(res.tokens)
        }
        setHasMore(res.hasMore)
        setTotal(res.total)
        setPage(res.page)
      } catch (e: any) {
        setError(e?.message || 'Unable to load tokens')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!isOpen) return
    // When query empty, we show popular + paginated popular-like list?
    // For spec: initial selector shows popular/suggested tokens, but search uses API.
    // We call fetchPage with debouncedQuery; page reset to 1 when query changes
    setPage(1)
    fetchPage(debouncedQuery, 1, false)
  }, [debouncedQuery, isOpen, fetchPage])

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return
    const nextPage = page + 1
    fetchPage(debouncedQuery, nextPage, true)
  }, [loadingMore, loading, hasMore, page, debouncedQuery, fetchPage])

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore()
      },
      { root: listRef.current, rootMargin: '100px', threshold: 0 }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [handleLoadMore, tokens])

  // When query empty we want to show suggested tokens section on top + list
  // For simplicity, when query empty, show popular as suggested, and tokens list is same as search with empty q (which returns verified first)
  // But to match spec "Suggested tokens" then token rows, we keep that.

  if (!isOpen) return null

  const isSearching = debouncedQuery.trim().length > 0
  const showPopularHeader = !isSearching && popular.length > 0

  return (
    <div className="fixed inset-0 z-[120] flex justify-center sm:items-start sm:pt-20 items-start pt-4 px-2 sm:px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-[#0A1017] border border-[#1C2838] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[58vh] sm:max-h-[52vh] animate-in fade-in zoom-in-[0.98] duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 h-[56px] flex-shrink-0 border-b border-[#1C2838]/60">
          <h2 className="text-[15px] font-bold text-white">Select a token</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111A25] border border-[#1C2838] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#152030] active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 sm:p-4 border-b border-[#1C2838]/40 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              autoFocus
              type="text"
              placeholder="Search token, symbol or mint address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#101822] border border-[#1C2838] rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#B7F34A]/50 focus:bg-[#0F1A25] transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2 sm:p-3 space-y-3 overscroll-contain">
          {/* Suggested */}
          {showPopularHeader && (
            <div>
              <div className="px-2 py-2 text-xs font-semibold text-[#64748B]">Suggested tokens</div>
              <div className="space-y-2">
                {popular.slice(0, 8).map((t) => (
                  <TokenRow key={`pop-${t.mintAddress}`} token={t} onSelect={onSelect} />
                ))}
              </div>
              <div className="h-px bg-[#1C2838]/40 my-3" />
            </div>
          )}

          {/* Title for list */}
          <div className="px-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">
              {isSearching ? `Search results ${total ? `(${total})` : ''}` : 'All tokens'}
            </span>
            {total > 0 && !isSearching && <span className="text-xs text-[#4A5C75]">{total} tokens</span>}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-[#1A2332] border border-[#1C2838] flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">Unable to load tokens</div>
              <div className="text-xs text-[#64748B] mb-4">{error}</div>
              <button
                onClick={() => fetchPage(debouncedQuery, 1, false)}
                className="px-4 py-2 bg-[#B7F34A] hover:bg-[#a3e05f] text-black font-bold rounded-full text-xs transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Tokens */}
          {!loading && !error && tokens.length > 0 && (
            <div className="space-y-2">
              {tokens.map((t) => (
                <TokenRow key={t.mintAddress} token={t} onSelect={onSelect} />
              ))}
              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className="h-1" />
              {loadingMore && (
                <div className="space-y-2 pt-2">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonRow key={`more-${i}`} />
                  ))}
                </div>
              )}
              {!hasMore && <div className="text-center text-xs text-[#4A5C75] py-3">End of list</div>}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && tokens.length === 0 && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-[#0D141E] border border-[#1C2838] flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-[#4A5C75]" />
              </div>
              <div className="text-sm font-bold text-white mb-1">No tokens found</div>
              <div className="text-xs text-[#64748B]">Try searching by token name, symbol, or mint address.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
