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

export function getAuthCallbackUrl(): string {
  return `${getAuthRedirectOrigin()}/auth/x/callback`
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

export function urlHasOAuthResult(): boolean {
  if (typeof window === 'undefined') return false
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return Boolean(query.get('code') || hash.get('access_token') || hash.get('error') || query.get('error'))
}
