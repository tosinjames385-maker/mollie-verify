import { peekPendingLike } from './authRedirect'
import { createAuthHandoffCode, withHandoffParam } from './supabaseOAuth'

const PENDING_KEY = 'vrfd_pending_mobile_wallet'
const CONNECT_QUERY = 'connect'

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
}

export function isMetaMaskInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/MetaMaskMobile/i.test(ua)) return true
  const eth = (window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum
  return Boolean(isMobileDevice() && eth?.isMetaMask)
}

export function isPhantomInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const w = window as Window & { solana?: { isPhantom?: boolean }; phantom?: { solana?: { isPhantom?: boolean } } }
  const injected = Boolean(w.phantom?.solana?.isPhantom || w.solana?.isPhantom)
  if (/Phantom/i.test(ua)) return true
  return Boolean(isMobileDevice() && injected)
}

async function buildWalletCarryUrl(connectWallet: 'metamask' | 'phantom'): Promise<string> {
  const code = await createAuthHandoffCode()
  let href = window.location.href
  if (code) href = withHandoffParam(href, code)

  const url = new URL(href)
  url.searchParams.set(CONNECT_QUERY, connectWallet)

  const pending = peekPendingLike()
  if (pending) url.searchParams.set('vrfd_like', pending)

  // Keep the current path so like flow resumes on the same token page.
  return url.toString()
}

/** Opens this page inside MetaMask’s in-app browser (required on phones). */
export async function openCurrentPageInMetaMask(): Promise<void> {
  const full = await buildWalletCarryUrl('metamask')
  const url = new URL(full)
  const dapp = `${url.host}${url.pathname}${url.search}`
  window.location.assign(`https://metamask.app.link/dapp/${dapp}`)
}

export async function openCurrentPageInPhantom(): Promise<void> {
  const full = await buildWalletCarryUrl('phantom')
  const href = encodeURIComponent(full)
  const ref = encodeURIComponent(new URL(full).origin)
  const universal = `https://phantom.app/ul/browse/${href}?ref=${ref}`

  // iOS Safari often needs the custom scheme if the universal link stays in Chrome/Safari.
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
    window.location.assign(`phantom://browse/${href}?ref=${ref}`)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(universal)
    }, 700)
    return
  }

  window.location.assign(universal)
}

export function walletRequestedInUrl(): string | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get(CONNECT_QUERY)
  if (value === 'metamask' || value === 'phantom') return value === 'metamask' ? 'MetaMask' : 'Phantom'
  return null
}

export function stripConnectQuery(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  let changed = false
  for (const key of [CONNECT_QUERY, 'vrfd_like']) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }
  if (!changed) return
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export function markPendingMobileWallet(name: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, name)
    localStorage.setItem(PENDING_KEY, name)
  } catch {
    /* ignore */
  }
}

export function getPendingMobileWallet(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY) || localStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

export function clearPendingMobileWallet(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

export function walletHintIsMetaMask(hint: string): boolean {
  const n = hint.toLowerCase()
  return n.includes('metamask') || n.includes('ethereum')
}

export function walletHintIsPhantom(hint: string): boolean {
  return hint.toLowerCase().includes('phantom')
}
