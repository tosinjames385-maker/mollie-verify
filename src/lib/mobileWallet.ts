import { peekPendingLike } from './authRedirect'
import { attachAuthCarry, createAuthHandoffCode, readReadyWalletAuthCarry } from './supabaseOAuth'

const PENDING_KEY = 'vrfd_pending_mobile_wallet'
const CONNECT_QUERY = 'connect'

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
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

function buildWalletCarryUrlSync(connectWallet: 'metamask' | 'phantom'): string {
  const url = new URL(window.location.href)
  url.searchParams.set(CONNECT_QUERY, connectWallet)
  const pending = peekPendingLike()
  if (pending) url.searchParams.set('vrfd_like', pending)
  return url.toString()
}

function attachReadyAuthCarry(href: string): string {
  const ready = readReadyWalletAuthCarry()
  return attachAuthCarry(href, { code: ready.code })
}

async function buildWalletCarryUrl(connectWallet: 'metamask' | 'phantom'): Promise<string> {
  let href = attachReadyAuthCarry(buildWalletCarryUrlSync(connectWallet))

  // Android Chrome drops the tap if we wait on a network call first.
  if (isAndroidDevice()) return href

  if (!new URL(href).searchParams.get('vrfd_handoff')) {
    const code = await createAuthHandoffCode()
    href = attachAuthCarry(href, { code })
  }
  return href
}

export function openPageInMetaMask(fullPageUrl: string): void {
  const url = new URL(fullPageUrl)
  const dapp = `${url.host}${url.pathname}${url.search}`
  window.location.assign(`https://metamask.app.link/dapp/${dapp}`)
}

/** Opens this page inside MetaMask’s in-app browser (required on phones). */
export async function openCurrentPageInMetaMask(): Promise<void> {
  openPageInMetaMask(await buildWalletCarryUrl('metamask'))
}

export function openPageInPhantom(fullPageUrl: string): void {
  openPhantomBrowse(fullPageUrl)
}

function openPhantomBrowse(fullPageUrl: string): void {
  const href = encodeURIComponent(fullPageUrl)
  const ref = encodeURIComponent(new URL(fullPageUrl).origin)
  const universal = `https://phantom.app/ul/browse/${href}?ref=${ref}`

  if (isAndroidDevice()) {
    const fallback = encodeURIComponent(universal)
    const intent = `intent://phantom.app/ul/browse/${href}?ref=${ref}#Intent;scheme=https;package=app.phantom;S.browser_fallback_url=${fallback};end`
    window.location.assign(intent)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.assign(`phantom://browse/${href}?ref=${ref}`)
      }
    }, 500)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(universal)
    }, 1200)
    return
  }

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
    window.location.assign(`phantom://browse/${href}?ref=${ref}`)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(universal)
    }, 700)
    return
  }

  window.location.assign(universal)
}

export async function openCurrentPageInPhantom(): Promise<void> {
  const full = await buildWalletCarryUrl('phantom')
  openPhantomBrowse(full)
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
  for (const key of [CONNECT_QUERY, 'vrfd_like', 'vrfd_handoff', 'vrfd_sess']) {
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

export function detectWalletBrowser(): 'phantom' | 'metamask' | null {
  if (isPhantomInAppBrowser()) return 'phantom'
  if (isMetaMaskInAppBrowser()) return 'metamask'
  return null
}
