export interface SearchToken {
  symbol: string
  name: string
  mintAddress: string
  logo: string
  verified: boolean
  marketCap?: string
  volume24h?: string
}

function formatUsd(value: unknown): string | undefined {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function pushUnique(out: SearchToken[], seen: Set<string>, token: SearchToken) {
  const mint = (token.mintAddress || '').trim()
  if (!mint || !token.symbol) return
  const key = mint.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  out.push({ ...token, mintAddress: mint })
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function loadVerifiedCatalog(): Promise<SearchToken[]> {
  const seen = new Set<string>()
  const out: SearchToken[] = []

  const lite = await fetchJson('https://lite-api.jup.ag/tokens/v2/tag?query=verified')
  if (Array.isArray(lite)) {
    for (const t of lite) {
      pushUnique(out, seen, {
        symbol: t.symbol,
        name: t.name,
        mintAddress: t.id || t.address,
        logo: t.icon || t.logoURI || '',
        verified: t.isVerified !== false,
      })
    }
  }

  if (out.length < 20) {
    const strict = await fetchJson('https://token.jup.ag/strict')
    if (Array.isArray(strict)) {
      for (const t of strict) {
        pushUnique(out, seen, {
          symbol: t.symbol,
          name: t.name,
          mintAddress: t.address,
          logo: t.logoURI || '',
          verified: true,
        })
      }
    }
  }

  if (out.length < 20) {
    const tagged = await fetchJson('https://tokens.jup.ag/tokens?tags=verified')
    if (Array.isArray(tagged)) {
      for (const t of tagged) {
        pushUnique(out, seen, {
          symbol: t.symbol,
          name: t.name,
          mintAddress: t.address,
          logo: t.logoURI || '',
          verified: true,
        })
      }
    }
  }

  return out
}

export async function searchLiveTokens(query: string): Promise<SearchToken[]> {
  const q = query.trim()
  if (!q) return []

  const seen = new Set<string>()
  const out: SearchToken[] = []

  const jup = await fetchJson(`https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(q)}`)
  if (Array.isArray(jup)) {
    for (const t of jup) {
      pushUnique(out, seen, {
        symbol: t.symbol,
        name: t.name,
        mintAddress: t.id || t.address,
        logo: t.icon || t.logoURI || '',
        verified: Boolean(t.isVerified),
        marketCap: formatUsd(t.mcap || t.fdv || t.marketCap),
        volume24h: formatUsd(t.stats24h?.buyVolume || t.volume24h),
      })
    }
  }

  const dex = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`)
  const pairs = Array.isArray(dex?.pairs) ? dex.pairs : []
  for (const p of pairs) {
    if (p.chainId !== 'solana' || !p.baseToken?.address) continue
    pushUnique(out, seen, {
      symbol: p.baseToken.symbol,
      name: p.baseToken.name,
      mintAddress: p.baseToken.address,
      logo: p.info?.imageUrl || '',
      verified: false,
      marketCap: formatUsd(p.marketCap || p.fdv),
      volume24h: formatUsd(p.volume?.h24),
    })
  }

  return out
}
