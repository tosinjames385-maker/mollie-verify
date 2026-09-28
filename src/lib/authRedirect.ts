/** Live site. Never send OAuth back to verifiedup.ag — that hostname has no DNS. */
export const CANONICAL_SITE_ORIGIN = 'https://www.verifiedjup.ag'

const DEAD_AUTH_HOSTS = new Set(['verifiedup.ag', 'www.verifiedup.ag'])

export function getAuthRedirectOrigin(): string {
  if (typeof window === 'undefined') return CANONICAL_SITE_ORIGIN
  const hostname = window.location.hostname.toLowerCase()
  if (DEAD_AUTH_HOSTS.has(hostname) || hostname.replace(/^www\./, '') === 'verifiedup.ag') {
    return CANONICAL_SITE_ORIGIN
  }
  if (hostname === 'verifiedjup.ag' || hostname === 'www.verifiedjup.ag') {
    return CANONICAL_SITE_ORIGIN
  }
  return window.location.origin
}

export function getAuthCallbackUrl(nextPath?: string, returnWallet?: string | null): string {
  const url = new URL(`${getAuthRedirectOrigin()}/auth/x/callback`)
  const next = safeReturnPath(nextPath || null)
  const wallet = asReturnWallet(returnWallet)
  if (nextPath && next !== '/submissions') {
    url.searchParams.set('next', withReturnWalletInPath(next, wallet))
  }
  if (wallet) url.searchParams.set('vrfd_return_wallet', wallet)
  return url.toString()
}

export function withForcedOAuthRedirect(oauthUrl: string, redirectTo: string): string {
  try {
    const parsed = new URL(oauthUrl)
    parsed.searchParams.set('redirect_to', redirectTo)
    return parsed.toString()
  } catch {
    return oauthUrl
  }
}

const AUTH_RETURN_KEY = 'vrfd_auth_return'
const PENDING_LIKE_KEY = 'vrfd_pending_like'
const RETURN_WALLET_KEY = 'vrfd_return_wallet'

export type ReturnWallet = 'phantom' | 'metamask' | 'solflare'

function asReturnWallet(value: string | null | undefined): ReturnWallet | null {
  return value === 'phantom' || value === 'metamask' || value === 'solflare' ? value : null
}

function writeReturnWalletCookie(wallet: ReturnWallet) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${RETURN_WALLET_KEY}=${wallet}; Max-Age=900; Path=/; SameSite=Lax${secure}`
}

function readReturnWalletCookie(): ReturnWallet | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${RETURN_WALLET_KEY}=([^;]*)`))
  return asReturnWallet(match?.[1] ? decodeURIComponent(match[1]) : null)
}

function clearReturnWalletCookie() {
  document.cookie = `${RETURN_WALLET_KEY}=; Max-Age=0; Path=/`
}

export function rememberReturnWallet(wallet: string) {
  if (typeof window === 'undefined') return
  const value = asReturnWallet(wallet)
  if (!value) return
  try {
    sessionStorage.setItem(RETURN_WALLET_KEY, value)
  } catch {
    /* ignore */
  }
  try {
    writeReturnWalletCookie(value)
  } catch {
    /* ignore */
  }
}

export function peekReturnWallet(): ReturnWallet | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = asReturnWallet(sessionStorage.getItem(RETURN_WALLET_KEY))
    if (stored) return stored
  } catch {
    /* ignore */
  }
  return readReturnWalletCookie()
}

export function takeReturnWallet(): ReturnWallet | null {
  const wallet = peekReturnWallet()
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(RETURN_WALLET_KEY)
    } catch {
      /* ignore */
    }
    clearReturnWalletCookie()
  }
  return wallet
}

export function returnWalletFromPath(path: string | null | undefined): ReturnWallet | null {
  if (!path) return null
  try {
    return asReturnWallet(new URL(path, 'https://local.invalid').searchParams.get('vrfd_return_wallet'))
  } catch {
    return null
  }
}

export function withReturnWalletInPath(path: string, wallet: string | null | undefined): string {
  const value = asReturnWallet(wallet)
  if (!value) return path
  try {
    const url = new URL(path, 'https://local.invalid')
    url.searchParams.set('vrfd_return_wallet', value)
    return `${url.pathname}${url.search}`
  } catch {
    const join = path.includes('?') ? '&' : '?'
    return `${path}${join}vrfd_return_wallet=${encodeURIComponent(value)}`
  }
}

function safeReturnPath(path: string | null): string {
  if (path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/auth/')) return path
  return '/submissions'
}

export function likeReturnPath(seed: string): string {
  const here = `${window.location.pathname}${window.location.search}`
  if (here.startsWith('/token/')) return here
  if (seed.length >= 32 && !seed.includes(' ')) return `/token/${seed}`
  return here
}

export function rememberAuthReturn(path: string, pendingLikeSeed?: string) {
  if (typeof window === 'undefined') return
  const existing = sessionStorage.getItem(AUTH_RETURN_KEY)
  if (pendingLikeSeed || !existing || existing.startsWith('/auth/')) {
    sessionStorage.setItem(AUTH_RETURN_KEY, safeReturnPath(path))
  }
  if (pendingLikeSeed) sessionStorage.setItem(PENDING_LIKE_KEY, pendingLikeSeed)
}

export function rememberCurrentPageForAuth() {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(AUTH_RETURN_KEY)) return
  const path = `${window.location.pathname}${window.location.search}`
  if (path.startsWith('/auth/')) return
  rememberAuthReturn(path)
}

export function peekAuthReturn(): string {
  if (typeof window === 'undefined') return '/submissions'
  return safeReturnPath(sessionStorage.getItem(AUTH_RETURN_KEY))
}

export function takeAuthReturn(): string {
  const path = peekAuthReturn()
  if (typeof window !== 'undefined') sessionStorage.removeItem(AUTH_RETURN_KEY)
  return path
}

export function peekPendingLike(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(PENDING_LIKE_KEY)
}

export function takePendingLike(seed: string): boolean {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem(PENDING_LIKE_KEY) !== seed) return false
  sessionStorage.removeItem(PENDING_LIKE_KEY)
  return true
}

export function clearPendingLike() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_LIKE_KEY)
}

/** If there is no pending like yet, use the token page in the URL. */
export function rememberLikeSeedFromLocation() {
  if (typeof window === 'undefined') return
  if (peekPendingLike()) return
  const match = window.location.pathname.match(/^\/token\/([^/]+)/)
  if (!match?.[1]) return
  rememberAuthReturn(`${window.location.pathname}${window.location.search}`, decodeURIComponent(match[1]))
}

export function urlHasOAuthResult(): boolean {
  if (typeof window === 'undefined') return false
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return Boolean(query.get('code') || hash.get('access_token') || hash.get('error') || query.get('error'))
}
