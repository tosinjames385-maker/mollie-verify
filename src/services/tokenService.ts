// ───────── Token Service Abstraction ─────────
// Frontend -> Backend (/api/live-tokens) -> Provider (Solana Labs + Jupiter)
// Keeps UI decoupled from provider. Caching, pagination, search are handled here.

export interface LiveToken {
  id: string
  chain: string
  name: string
  symbol: string
  mintAddress: string
  logo: string | null
  decimals: number
  verified: boolean
  price?: number | null
  marketCap?: number | null
  volume24h?: number | null
  tags?: string[]
}

export interface SearchResult {
  tokens: LiveToken[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ───────── Frontend cache (memory) ─────────
const popularCache = new Map<string, { data: LiveToken[]; ts: number }>()
const searchCache = new Map<string, { data: SearchResult; ts: number }>()
const mintCache = new Map<string, { data: LiveToken; ts: number }>()

const POPULAR_TTL = 5 * 60 * 1000 // 5 min
const SEARCH_TTL = 60 * 1000 // 1 min
const MINT_TTL = 5 * 60 * 1000

function isFresh(ts: number, ttl: number) {
  return Date.now() - ts < ttl
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`fetch ${url} ${res.status} ${txt}`)
  }
  return res.json() as Promise<T>
}

// ───────── Direct fallback (no backend, production on Vercel static) ─────────
// Public Solana token list – no API key, reliable, real data
let directAllTokens: LiveToken[] | null = null
let directAllTs = 0
const DIRECT_TTL = 5 * 60 * 1000

const POPULAR_MINTS_FALLBACK = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
]

function isVerifiedFallback(tags?: string[]) {
  if (!tags) return false
  return tags.includes('verified') || tags.includes('strict')
}

async function getDirectAllTokens(): Promise<LiveToken[]> {
  const now = Date.now()
  if (directAllTokens && now - directAllTs < DIRECT_TTL) return directAllTokens
  const res = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')
  if (!res.ok) throw new Error('direct token list failed')
  const json = (await res.json()) as { tokens: any[] }
  const mapped: LiveToken[] = (json.tokens || []).map((t: any) => ({
    id: t.address,
    chain: 'solana',
    name: t.name,
    symbol: t.symbol,
    mintAddress: t.address,
    logo: t.logoURI || null,
    decimals: t.decimals,
    verified: isVerifiedFallback(t.tags),
    price: null,
    marketCap: null,
    volume24h: null,
    tags: t.tags,
  }))
  directAllTokens = mapped
  directAllTs = now
  return mapped
}

async function directPopular(): Promise<LiveToken[]> {
  const all = await getDirectAllTokens()
  const byMint = new Map(all.map((t) => [t.mintAddress, t]))
  const popular: LiveToken[] = []
  const seen = new Set<string>()
  for (const mint of POPULAR_MINTS_FALLBACK) {
    const tok = byMint.get(mint)
    if (tok && !seen.has(tok.mintAddress)) {
      popular.push(tok)
      seen.add(tok.mintAddress)
    }
  }
  if (popular.length < 8) {
    for (const tok of all) {
      if (tok.verified && !seen.has(tok.mintAddress)) {
        popular.push(tok)
        seen.add(tok.mintAddress)
      }
      if (popular.length >= 12) break
    }
  }
  return popular.slice(0, 12)
}

async function directSearch(query: string, page: number, limit: number): Promise<SearchResult> {
  const all = await getDirectAllTokens()
  const q = query.trim().toLowerCase()
  let filtered = all
  if (q) {
    filtered = all.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.mintAddress.toLowerCase().includes(q)
    )
  } else {
    filtered = [...all].sort((a, b) => Number(b.verified) - Number(a.verified))
  }
  const total = filtered.length
  const start = (page - 1) * limit
  const end = start + limit
  return {
    tokens: filtered.slice(start, end),
    total,
    page,
    limit,
    hasMore: end < total,
  }
}

async function directGetByMint(mint: string): Promise<LiveToken> {
  const all = await getDirectAllTokens()
  const tok = all.find((t) => t.mintAddress.toLowerCase() === mint.toLowerCase())
  if (!tok) throw new Error('Token not found')
  return tok
}

// ───────── API abstraction ─────────
export async function getPopularTokens(): Promise<LiveToken[]> {
  const key = 'popular'
  const cached = popularCache.get(key)
  if (cached && isFresh(cached.ts, POPULAR_TTL)) return cached.data
  try {
    const data = await fetchJSON<LiveToken[]>('/api/live-tokens/popular')
    popularCache.set(key, { data, ts: Date.now() })
    return data
  } catch {
    // fallback to direct public list (Vercel static)
    const data = await directPopular()
    popularCache.set(key, { data, ts: Date.now() })
    return data
  }
}

export async function searchTokens(
  query: string,
  page = 1,
  limit = 20
): Promise<SearchResult> {
  const key = `${query.trim().toLowerCase()}|${page}|${limit}`
  const cached = searchCache.get(key)
  if (cached && isFresh(cached.ts, SEARCH_TTL)) return cached.data
  try {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    })
    const data = await fetchJSON<SearchResult>(`/api/live-tokens/search?${params.toString()}`)
    searchCache.set(key, { data, ts: Date.now() })
    return data
  } catch {
    const data = await directSearch(query, page, limit)
    searchCache.set(key, { data, ts: Date.now() })
    return data
  }
}

export async function getTokenByMint(mintAddress: string): Promise<LiveToken> {
  const key = mintAddress.toLowerCase()
  const cached = mintCache.get(key)
  if (cached && isFresh(cached.ts, MINT_TTL)) return cached.data
  try {
    const data = await fetchJSON<LiveToken>(`/api/live-tokens/mint/${encodeURIComponent(mintAddress)}`)
    mintCache.set(key, { data, ts: Date.now() })
    return data
  } catch {
    const data = await directGetByMint(mintAddress)
    mintCache.set(key, { data, ts: Date.now() })
    return data
  }
}

// Alias for spec
export const getTokenMetadata = getTokenByMint

// Utility – clear caches (e.g., after 5 min or manual)
export function clearTokenCache() {
  popularCache.clear()
  searchCache.clear()
  mintCache.clear()
}
