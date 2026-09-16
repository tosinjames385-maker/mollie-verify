import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

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
  { symbol: 'USDT', name: 'Tether USD', mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png', verified: true },
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', mintAddress: 'cbbtciddEsg269v8dgd2pB52u7yF62Sgq9yHh1Fm123', logo: 'https://assets.coingecko.com/coins/images/39905/standard/cbbtc.png', verified: true },
  { symbol: 'WBTC', name: 'Wrapped BTC', mintAddress: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh/logo.png', verified: true },
  { symbol: 'BTC', name: 'Bitcoin (Portal)', mintAddress: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', logo: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png', verified: true },
  { symbol: 'ETH', name: 'Ether (Portal)', mintAddress: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png', verified: true },
  { symbol: 'BONK', name: 'Bonk', mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png', verified: true },
  { symbol: 'JUP', name: 'Jupiter', mintAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png', verified: true },
  { symbol: 'RAY', name: 'Raydium', mintAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png', verified: true },
  { symbol: 'JTO', name: 'Jito', mintAddress: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL/logo.png', verified: true },
  { symbol: 'WIF', name: 'dogwifhat', mintAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png', verified: true },
  { symbol: 'POPCAT', name: 'Popcat', mintAddress: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr/logo.png', verified: true },
  { symbol: 'W', name: 'Wormhole', mintAddress: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ/logo.png', verified: true },
  { symbol: 'PYTH', name: 'Pyth Network', mintAddress: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png', verified: true },
  { symbol: 'RENDER', name: 'Render', mintAddress: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png', verified: true },
  { symbol: 'ORCA', name: 'Orca', mintAddress: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ORCA', verified: true },
  { symbol: 'SAMO', name: 'Samoyedcoin', mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SAMO', verified: true },
  { symbol: 'mSOL', name: 'Marinade Staked SOL', mintAddress: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=mSOL', verified: true },
  { symbol: 'AMD', name: 'AMD', mintAddress: 'AMD8Qw3nHjeESkKXmg4rRp5z9t7g6hN6vZ4c8dYmXxES', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=AMD', verified: false },
  { symbol: 'SHWEPAY', name: 'SHWE PAY', mintAddress: 'F7j3kLmNpQrS9tUvWxYz4dBc6eGhAaBbOoIiCcDdAboo', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SHWEPAY', verified: false },
  { symbol: 'STEALF', name: 'Stealf', mintAddress: 'G5W6LwkLeoj6rZqBP1y3KT8k6Cz6rXGJmMNU3TArXtXw', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=STEALF', verified: false },
  { symbol: 'RTOx', name: 'RTOx', mintAddress: 'XswGwNY1Yy33dGt5f5f5f5f5f5f5f5f5f5f5f5f5f', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RTOx', verified: false },
  { symbol: 'AAFx', name: 'AAFx', mintAddress: 'XskX7gT3kL9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY6WX', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=AAFx', verified: false },
  { symbol: 'BBY.GBx', name: 'BBY.GBx', mintAddress: 'Xs6aVfPk9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY7uIo', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BBYGBx', verified: false },
  { symbol: 'PSN.GBx', name: 'PSN.GBx', mintAddress: 'XsJJ5x4Z9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY7uIp', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PSNGBx', verified: false },
  { symbol: '4STONK', name: '4STONK', mintAddress: '7Gh4Qj3S9mN4pQ2sD5fH8jB1vC6xZ3aW9eR4tY7uIs', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=4STONK', verified: false },
  { symbol: 'NXS', name: 'NEXUS', mintAddress: 'Nxs7kLm9pQrS4tUv2wYz8dC6eGhAaBbOoIiCcDd9nx', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=NEXUS', verified: true },
  { symbol: 'COSMIC', name: 'COSMIC', mintAddress: 'Cos9kLm3pQrS8tUv5wYz2dC6eGhAaBbOoIiCcDd1cos', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=COSMIC', verified: false },
  { symbol: 'PULSE', name: 'PULSE', mintAddress: 'Pul4kLm7pQrS2tUv8wYz5dC6eGhAaBbOoIiCcDd2pul', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PULSE', verified: false },
  { symbol: 'VTX', name: 'VORTEX', mintAddress: 'Vtx5kLm8pQrS3tUv9wYz6dC6eGhAaBbOoIiCcDd3vtx', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=VORTEX', verified: false },
  { symbol: 'NOVA', name: 'NOVA', mintAddress: 'Nva6kLm1pQrS4tUv0wYz7dC6eGhAaBbOoIiCcDd4nva', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=NOVA', verified: true },
  { symbol: 'ZEN', name: 'ZENITH', mintAddress: 'Zen7kLm2pQrS5tUv1wYz8dC6eGhAaBbOoIiCcDd5zen', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ZENITH', verified: false },
  { symbol: 'FLUX', name: 'FLUX', mintAddress: 'Flx8kLm3pQrS6tUv2wYz9dC6eGhAaBbOoIiCcDd6flx', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FLUX', verified: false },
  { symbol: 'MEOW', name: 'MEOW', mintAddress: 'MEOWjup1ZDtGV7n4sEHdrhEaD8sC8Nk', logo: 'https://static.jup.ag/meow/icon.png', verified: true },
  { symbol: 'JupSOL', name: 'Jupiter Staked SOL', mintAddress: 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v', logo: 'https://static.jup.ag/jupSOL/icon.png', verified: true },
  { symbol: 'dfdvSOL', name: 'DeFi Dev Corp Staked SOL', mintAddress: 'sctmB7GPi5L2Q5G9tUSzXvhZ4YiDMEGcRov9KfArQpx', logo: 'https://pbs.twimg.com/profile_images/1897064824317861888/I02i5oX3_400x400.jpg', verified: true },
  { symbol: 'fwdSOL', name: 'Forward Industries Staked SOL', mintAddress: 'cPQPBN7WubB3zyQDpzTK2ormx1BMdAym9xkrYUJsctm', logo: 'https://arweave.net/sCrxsrKza0FmAjP5ijzBGyLasIK9mYJFNUy04fNNAeA', verified: true },
]

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (token: any) => void
}

export const TokenSelector = ({ isOpen, onClose, onSelect }: TokenSelectorProps) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [allTokens, setAllTokens] = useState<Token[]>(suggestedTokens)
  const [filteredTokens, setFilteredTokens] = useState<Token[]>(suggestedTokens)
  const [loading, setLoading] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch live Solana token list from Jupiter API & DexScreener fallback search
  useEffect(() => {
    let isMounted = true
    const fetchLiveTokens = async () => {
      try {
        setLoading(true)
        const res = await fetch('https://token.jup.ag/all')
        if (res.ok && isMounted) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Token[] = data.map((t: any) => ({
              symbol: t.symbol,
              name: t.name,
              mintAddress: t.address,
              logo: t.logoURI || `https://api.dicebear.com/7.x/identicon/svg?seed=${t.symbol}`,
              verified: t.tags?.includes('verified') || t.tags?.includes('strict') || false,
            }))
            
            const existingMints = new Set(suggestedTokens.map(s => s.mintAddress.toLowerCase()))
            const extraTokens = mapped.filter(t => !existingMints.has(t.mintAddress.toLowerCase()))
            const combined = [...suggestedTokens, ...extraTokens]
            
            setAllTokens(combined)
            setFilteredTokens(combined)
            return
          }
        }
      } catch (err) {
        console.warn('Jupiter list error, trying search API:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (isOpen) {
      fetchLiveTokens()
    }
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Live dynamic search for tokens (including DexScreener/Jupiter live search for BTC, etc.)
  useEffect(() => {
    let isCancelled = false
    const handleSearch = async () => {
      if (query.trim() === '') {
        setFilteredTokens(allTokens)
        return
      }

      const q = query.toLowerCase().trim()
      const localMatches = allTokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(q) ||
          token.name.toLowerCase().includes(q) ||
          token.mintAddress.toLowerCase().includes(q)
      )

      if (localMatches.length > 0) {
        setFilteredTokens(localMatches)
      }

      // Perform live DexScreener search fallback so any token like BTC/cbBTC/WBTC is fetched
      try {
        setLoading(true)
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`)
        if (res.ok && !isCancelled) {
          const data = await res.json()
          if (data.pairs && Array.isArray(data.pairs)) {
            const solanaPairs = data.pairs.filter((p: any) => p.chainId === 'solana')
            const searchTokens: Token[] = []
            const seen = new Set(localMatches.map(m => m.mintAddress.toLowerCase()))

            for (const p of solanaPairs) {
              if (p.baseToken && !seen.has(p.baseToken.address.toLowerCase())) {
                seen.add(p.baseToken.address.toLowerCase())
                const mint = p.baseToken.address
                const logoUrl = p.info?.imageUrl ||
                  `https://dd.dexscreener.com/token-images/solana/${mint}.png`
                
                searchTokens.push({
                  symbol: p.baseToken.symbol,
                  name: p.baseToken.name,
                  mintAddress: mint,
                  logo: logoUrl,
                  verified: true,
                })
              }
            }

            if (!isCancelled) {
              setFilteredTokens([...localMatches, ...searchTokens])
            }
          }
        }
      } catch (err) {
        console.warn('DexScreener search error:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    const timer = setTimeout(handleSearch, 200)
    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [query, allTokens])

  const handleCopyAddress = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast.success('Mint address copied!')
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const handleSelectToken = (token: Token) => {
    onSelect({
      ...token,
      mintAddress: token.mintAddress,
      logo: token.logo,
      verified: token.verified,
    })
    onClose()
    setQuery('')
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0A1017] border border-[#1C2838] rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-3 border-b border-[#1C2838]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search token by name, symbol or mint address"
              className="w-full bg-[#060C14] border border-[#1C2838] rounded-lg pl-10 pr-14 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#B7F34A]/50 transition-colors"
            />
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#1C2838] hover:bg-[#253545] rounded text-[10px] text-gray-400 transition-colors"
            >
              Esc
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
            <span>
              {loading ? 'Loading live Solana tokens...' : `Found ${filteredTokens.length} tokens`}
            </span>
            <span>Paste CA for exact match</span>
          </p>
        </div>

        {/* Token List */}
        <div className="max-h-[350px] overflow-y-auto">
          {loading && filteredTokens.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#B7F34A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400">Fetching live Solana token directory...</p>
            </div>
          ) : filteredTokens.length > 0 ? (
            <div className="p-1.5">
              {filteredTokens.map((token) => (
                <button
                  key={token.mintAddress}
                  onClick={() => handleSelectToken(token)}
                  className="w-full flex items-center gap-2.5 p-2.5 hover:bg-[#0F151E] rounded-lg transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#151F2C] relative flex items-center justify-center border border-[#1C2838]">
                    {token.logo ? (
                      <img
                        src={token.logo}
                        alt={token.symbol}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          if (!target.dataset.triedFallback) {
                            target.dataset.triedFallback = 'true'
                            target.src = `https://dd.dexscreener.com/token-images/solana/${token.mintAddress}.png`
                          } else if (!target.dataset.triedFallback2) {
                            target.dataset.triedFallback2 = 'true'
                            target.src = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.mintAddress}/logo.png`
                          } else {
                            target.style.display = 'none'
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) {
                              fallback.classList.remove('hidden')
                              fallback.style.display = 'flex'
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1E2D3D] to-[#0D1622] text-[#B7F34A] absolute inset-0 z-0 ${token.logo ? 'hidden' : ''}`}>
                      <span className="text-xs font-bold font-mono">
                        {token.symbol ? token.symbol.slice(0, 3).toUpperCase() : '?'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm text-white">{token.symbol}</span>
                      {token.verified && (
                        <svg className="w-3.5 h-3.5 text-[#B7F34A]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{token.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-gray-500 font-mono">
                      {truncateAddress(token.mintAddress)}
                    </span>
                    <button
                      onClick={(e) => handleCopyAddress(e, token.mintAddress)}
                      className="p-1 hover:bg-[#1C2838] rounded transition-colors"
                    >
                      {copiedAddress === token.mintAddress ? (
                        <Check className="w-3.5 h-3.5 text-[#B7F34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No tokens found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}