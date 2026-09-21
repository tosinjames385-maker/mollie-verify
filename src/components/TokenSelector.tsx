import { useState, useEffect, useRef } from 'react'
import { Search, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSearchableSubmissionTokens } from '../data/demoSubmissions'
import { TokenImage } from './TokenImage'
import { loadVerifiedCatalog, searchLiveTokens } from '../lib/tokenSearch'

interface Token {
  symbol: string
  name: string
  mintAddress: string
  logo: string
  verified: boolean
}

const suggestedTokens: Token[] = [
  { symbol: 'SOL', name: 'Wrapped SOL', mintAddress: 'So11111111111111111111111111111111111111112', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', verified: true },
  { symbol: 'USDC', name: 'USD Coin', mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png', verified: true },
  { symbol: 'USDT', name: 'USDT', mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png', verified: true },
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', mintAddress: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij', logo: 'https://assets.coingecko.com/coins/images/39969/small/cbbtc.png', verified: true },
  { symbol: 'ZEC', name: 'Zcash', mintAddress: 'A7bdemMNSKxG9Tq9g7HqWqK8XqJ5nYQXaS', logo: 'https://assets.coingecko.com/coins/images/486/small/circle-zcash-color.png', verified: true },
  { symbol: 'ETH', name: 'Ether (Portal)', mintAddress: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', verified: true },
  { symbol: 'STONK', name: 'STONK', mintAddress: '6GmANaxUNaxUNaxUNaxUNaxUNaxUNaxUNax', logo: 'https://api.dicebear.com/7.x/initials/png?seed=STONK&backgroundColor=1a1a2e&size=128', verified: true },
]

const extraKnown: Token[] = [
  { symbol: 'JUP', name: 'Jupiter', mintAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', logo: 'https://static.jup.ag/jup/icon.png', verified: true },
  { symbol: 'BONK', name: 'Bonk', mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I', verified: true },
  { symbol: 'WIF', name: 'dogwifhat', mintAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', logo: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link', verified: true },
  { symbol: 'TBBB', name: 'The Baby Bitcoin Bull', mintAddress: '3vLDFBRXxXKZ6McEwaSHf3t6GfBULL', logo: 'https://api.dicebear.com/7.x/bottts/png?seed=TBBB&backgroundColor=1a1a2e&size=128', verified: false },
]

function mergeTokens(...lists: Token[][]): Token[] {
  const seen = new Set<string>()
  const out: Token[] = []
  for (const list of lists) {
    for (const t of list) {
      const key = t.mintAddress.toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(t)
    }
  }
  return out
}

function matchesQuery(token: Token, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  return (
    token.symbol.toLowerCase().includes(query) ||
    token.name.toLowerCase().includes(query) ||
    token.mintAddress.toLowerCase().includes(query)
  )
}

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: Token) => void
}

export const TokenSelector = ({ isOpen, onClose, onSelect }: TokenSelectorProps) => {
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState<Token[]>(() =>
    mergeTokens(suggestedTokens, extraKnown, getSearchableSubmissionTokens())
  )
  const [results, setResults] = useState<Token[]>(suggestedTokens)
  const [loading, setLoading] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults(suggestedTokens)
      return
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      const local = mergeTokens(suggestedTokens, extraKnown, getSearchableSubmissionTokens())
      const verified = await loadVerifiedCatalog()
      if (!cancelled) setCatalog(mergeTokens(local, verified))
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const q = query.trim()

    if (!q) {
      setResults(suggestedTokens)
      setLoading(false)
      return
    }

    const localMatches = catalog.filter((t) => matchesQuery(t, q))
    setResults(localMatches)

    const timer = setTimeout(async () => {
      setLoading(true)
      const extra = await searchLiveTokens(q)
      if (!cancelled) {
        setResults(mergeTokens(localMatches, extra))
        setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, catalog, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleCopyAddress = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success('Mint address copied!')
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const truncateAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`

  if (!isOpen) return null

  const isSearching = query.trim().length > 0

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0A1017] border border-[#1C2838] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-[#1C2838]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Submit metadata and insights for a token"
              className="w-full bg-[#060C14] border border-[#1C2838] rounded-xl pl-10 pr-14 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#B7F34A]/50 transition-colors"
            />
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#1C2838] hover:bg-[#253545] rounded text-[10px] text-gray-400 transition-colors"
            >
              Esc
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2.5 px-0.5">
            {isSearching
              ? `Found ${results.length} result${results.length === 1 ? '' : 's'}, paste CA to get more accurate results`
              : 'Suggested tokens'}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-400">Searching tokens...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((token) => (
                <button
                  key={token.mintAddress}
                  onClick={() => {
                    onSelect(token)
                    onClose()
                    setQuery('')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0F151E] transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#151F2C]">
                    <TokenImage src={token.logo} symbol={token.symbol} alt={token.symbol} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-white">{token.symbol}</span>
                      {token.verified && (
                        <svg className="w-3.5 h-3.5 text-[#B7F34A]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{token.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-gray-500 font-mono">{truncateAddress(token.mintAddress)}</span>
                    <span
                      role="button"
                      onClick={(e) => handleCopyAddress(e, token.mintAddress)}
                      className="p-1 hover:bg-[#1C2838] rounded transition-colors"
                    >
                      {copiedAddress === token.mintAddress ? (
                        <Check className="w-3.5 h-3.5 text-[#B7F34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-gray-500 text-sm">No tokens found</p>
              <p className="text-gray-600 text-xs mt-1">Paste a mint address for a more accurate match</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
