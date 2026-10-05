export type CarriedToken = {
  name: string
  symbol: string
  mintAddress: string
  logo: string | null
  verified: boolean
  price?: number | null
}

const NAME = 'tn'
const SYMBOL = 'ts'
const LOGO = 'tl'
const VERIFIED = 'tv'

export function selectedTokenQuery(token: {
  name: string
  symbol: string
  logo?: string | null
  verified?: boolean
}): string {
  const params = new URLSearchParams()
  params.set(NAME, token.name.slice(0, 80))
  params.set(SYMBOL, token.symbol.slice(0, 32))
  if (token.verified) params.set(VERIFIED, '1')
  const logo = (token.logo || '').trim()
  if (logo.startsWith('https://') && logo.length <= 240) params.set(LOGO, logo)
  return params.toString()
}

export function tokenPath(token: {
  mintAddress: string
  name: string
  symbol: string
  logo?: string | null
  verified?: boolean
}): string {
  return `/token/${encodeURIComponent(token.mintAddress)}?${selectedTokenQuery(token)}`
}

export function readCarriedToken(search: string, mintAddress: string): CarriedToken | null {
  if (!mintAddress) return null
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const name = params.get(NAME)?.trim()
  const symbol = params.get(SYMBOL)?.trim()
  if (!name || !symbol) return null
  const logo = params.get(LOGO)
  return {
    name,
    symbol,
    mintAddress,
    logo: logo && logo.startsWith('https://') ? logo : null,
    verified: params.get(VERIFIED) === '1',
  }
}
