import { Router } from 'express'

export const liveTokensRouter = Router()

// ───────── Types ─────────
interface RawSolanaToken {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  tags?: string[]
  extensions?: { coingeckoId?: string }
}

interface LiveToken {
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

// ───────── In-memory cache ─────────
let cachedAllTokens: LiveToken[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Curated popular mint order (unique identifier = mintAddress)
const POPULAR_MINTS = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYTH
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963PgwQ', // Jupiter-related (example)
  'EB5uzFqATWbKFY3zF8WkJzXxZx7Yx7Yx7Yx7Yx7Yx7Yx7Y', // placeholder – will be ignored if not found
]

const FALLBACK_POPULAR_MINTS = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
]

// ───────── Helpers ─────────
function isVerifiedToken(raw: RawSolanaToken): boolean {
  // Reliable verification: Jupiter strict list via tags, or known verified via token-list
  // Tags contain 'verified' or specific trusted sources. Do NOT mark all as verified.
  if (!raw.tags) return false
  const trustedTags = new Set(['verified', 'community', 'strict'])
  // Only treat as verified if explicitly tagged verified/strict – community alone is not enough
  return raw.tags.includes('verified') || raw.tags.includes('strict')
}

async function fetchSolanaTokenList(): Promise<RawSolanaToken[]> {
  // Primary: Solana Labs token list (public, no key)
  // Fallback: Jupiter token list if primary fails
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json',
      { headers: { 'User-Agent': 'MOLLIE/1.0' } }
    )
    if (!res.ok) throw new Error(`solana.tokenlist ${res.status}`)
    const json = (await res.json()) as { tokens: RawSolanaToken[] }
    return json.tokens || []
  } catch (e) {
    console.warn('[liveTokens] solana.tokenlist failed, trying jupiter', e)
    try {
      // Jupiter public list – no key
      const jupRes = await fetch('https://price.jup.ag/v6/tokens', { headers: { 'User-Agent': 'MOLLIE/1.0' } })
      if (!jupRes.ok) throw new Error(`jup tokens ${jupRes.status}`)
      const jupJson = await jupRes.json()
      // jupiter returns array or {tokens:[]}
      const arr = Array.isArray(jupJson) ? jupJson : jupJson.tokens || []
      return arr.map((t: any) => ({
        address: t.address || t.id,
        chainId: 101,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        logoURI: t.logoURI || t.logo,
        tags: t.tags,
      }))
    } catch (e2) {
      console.error('[liveTokens] both sources failed', e2)
      return []
    }
  }
}

async function getAllTokensCached(): Promise<LiveToken[]> {
  const now = Date.now()
  if (cachedAllTokens && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedAllTokens
  }
  const raw = await fetchSolanaTokenList()
  const mapped: LiveToken[] = raw.map((t) => ({
    id: t.address,
    chain: 'solana',
    name: t.name,
    symbol: t.symbol,
    mintAddress: t.address,
    logo: t.logoURI || null,
    decimals: t.decimals,
    verified: isVerifiedToken(t),
    price: null,
    marketCap: null,
    volume24h: null,
    tags: t.tags,
  }))
  // Enrich price/marketCap optionally via Jupiter Price – best effort, non-blocking
  // We keep it cheap: only for popular mints to avoid huge request
  try {
    const popularForPrice = mapped.filter((t) => POPULAR_MINTS.includes(t.mintAddress)).slice(0, 30)
    if (popularForPrice.length) {
      const ids = popularForPrice.map((t) => t.mintAddress).join(',')
      const priceRes = await fetch(`https://price.jup.ag/v6/price?ids=${encodeURIComponent(ids)}`)
      if (priceRes.ok) {
        const priceJson = (await priceRes.json()) as { data: Record<string, { price: number }> }
        for (const tok of mapped) {
          const p = priceJson.data?.[tok.mintAddress]
          if (p) tok.price = p.price
        }
      }
    }
  } catch (e) {
    // price enrichment is optional
    console.warn('[liveTokens] price enrichment failed', e)
  }

  cachedAllTokens = mapped
  cacheTimestamp = now
  return mapped
}

// Manual refresh endpoint helper (for debugging)
function clearCache() {
  cachedAllTokens = null
  cacheTimestamp = 0
}

// ───────── Routes ─────────

// GET /api/live-tokens/popular – curated popular tokens in suggested order
liveTokensRouter.get('/popular', async (_req, res) => {
  try {
    const all = await getAllTokensCached()
    const byMint = new Map(all.map((t) => [t.mintAddress, t]))
    const popular: LiveToken[] = []
    const seen = new Set<string>()
    for (const mint of POPULAR_MINTS) {
      const tok = byMint.get(mint)
      if (tok && !seen.has(tok.mintAddress)) {
        popular.push(tok)
        seen.add(tok.mintAddress)
      }
    }
    // Fill up to 12 if some popular not found (fallback)
    if (popular.length < 10) {
      for (const mint of FALLBACK_POPULAR_MINTS) {
        const tok = byMint.get(mint)
        if (tok && !seen.has(tok.mintAddress)) {
          popular.push(tok)
          seen.add(tok.mintAddress)
        }
        if (popular.length >= 12) break
      }
    }
    // If still less than 12, add top verified tokens
    if (popular.length < 12) {
      for (const tok of all) {
        if (tok.verified && !seen.has(tok.mintAddress)) {
          popular.push(tok)
          seen.add(tok.mintAddress)
        }
        if (popular.length >= 12) break
      }
    }
    res.json(popular.slice(0, 12))
  } catch (e) {
    console.error('[liveTokens/popular] error', e)
    res.status(500).json({ error: 'Failed to fetch popular tokens' })
  }
})

// GET /api/live-tokens/search?q=&page=1&limit=20
liveTokensRouter.get('/search', async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim() ?? ''
    const page = Math.max(parseInt((req.query.page as string) || '1', 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10) || 20, 1), 50)

    const all = await getAllTokensCached()

    let filtered: LiveToken[] = all
    if (q) {
      const lower = q.toLowerCase()
      const isMintLike = q.length >= 32 // mint addresses are 32-44 base58
      filtered = all.filter((t) => {
        if (isMintLike) {
          return t.mintAddress.toLowerCase().includes(lower)
        }
        return (
          t.symbol.toLowerCase().includes(lower) ||
          t.name.toLowerCase().includes(lower) ||
          t.mintAddress.toLowerCase().includes(lower)
        )
      })
      // For mint address exact-ish search, prioritize exact match
      if (isMintLike) {
        filtered.sort((a, b) => {
          const aExact = a.mintAddress.toLowerCase() === lower ? -1 : 0
          const bExact = b.mintAddress.toLowerCase() === lower ? -1 : 0
          return aExact - bExact
        })
      }
    } else {
      // No query: return popular-like slice (verified first)
      filtered = [...all].sort((a, b) => Number(b.verified) - Number(a.verified))
    }

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const paginated = filtered.slice(start, end)

    res.json({
      tokens: paginated,
      total,
      page,
      limit,
      hasMore: end < total,
    })
  } catch (e) {
    console.error('[liveTokens/search] error', e)
    res.status(500).json({ error: 'Failed to search tokens' })
  }
})

// GET /api/live-tokens/mint/:mintAddress
liveTokensRouter.get('/mint/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params
    const all = await getAllTokensCached()
    const tok = all.find((t) => t.mintAddress.toLowerCase() === mintAddress.toLowerCase())
    if (!tok) return res.status(404).json({ error: 'Token not found' })
    res.json(tok)
  } catch (e) {
    console.error('[liveTokens/mint] error', e)
    res.status(500).json({ error: 'Failed to fetch token' })
  }
})

// GET /api/live-tokens/cache/clear – manual (protect with admin in prod, open for now)
liveTokensRouter.post('/cache/clear', (_req, res) => {
  clearCache()
  res.json({ ok: true })
})
