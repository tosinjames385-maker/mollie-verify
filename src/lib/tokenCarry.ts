// Carries the searched token's display info in the URL so it survives a full page
// reload — in particular when the page is reopened inside a wallet's in-app
// browser, where React Router navigation state is lost.

export type CarriedToken = {
  symbol: string
  name: string
  logo: string | null
  verified: boolean
}

const SYMBOL_KEY = 'tk_sym'
const NAME_KEY = 'tk_name'
const LOGO_KEY = 'tk_logo'
const VERIFIED_KEY = 'tk_v'

/** Appends the token display fields to an existing `/token/<mint>` path. */
export function withCarriedToken(path: string, token: CarriedToken): string {
  try {
    const url = new URL(path, 'https://local.invalid')
    url.searchParams.set(SYMBOL_KEY, token.symbol)
    url.searchParams.set(NAME_KEY, token.name)
    if (token.logo) url.searchParams.set(LOGO_KEY, token.logo)
    if (token.verified) url.searchParams.set(VERIFIED_KEY, '1')
    return `${url.pathname}${url.search}`
  } catch {
    return path
  }
}

/** Reads the carried token from a location search string, if present. */
export function readCarriedToken(search: string | null | undefined): CarriedToken | null {
  if (!search) return null
  const params = new URLSearchParams(search)
  const symbol = params.get(SYMBOL_KEY)
  if (!symbol) return null
  return {
    symbol,
    name: params.get(NAME_KEY) || symbol,
    logo: params.get(LOGO_KEY),
    verified: params.get(VERIFIED_KEY) === '1',
  }
}
