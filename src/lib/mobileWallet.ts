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
  if (/Phantom/i.test(ua) && isMobileDevice()) return true
  const w = window as Window & { solana?: { isPhantom?: boolean }; phantom?: { solana?: unknown } }
  return Boolean(isMobileDevice() && (w.phantom?.solana || w.solana?.isPhantom))
}

function dappTarget(href = window.location.href): string {
  const url = new URL(href)
  url.searchParams.set(CONNECT_QUERY, 'metamask')
  return `${url.host}${url.pathname}${url.search}`
}

/** Opens this page inside MetaMask’s in-app browser (required on phones). */
export function openCurrentPageInMetaMask(): void {
  const dapp = dappTarget()
  window.location.assign(`https://metamask.app.link/dapp/${dapp}`)
}

export function openCurrentPageInPhantom(): void {
  const url = new URL(window.location.href)
  url.searchParams.set(CONNECT_QUERY, 'phantom')
  const href = encodeURIComponent(url.toString())
  const ref = encodeURIComponent(url.origin)
  window.location.assign(`https://phantom.app/ul/browse/${href}?ref=${ref}`)
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
  if (!url.searchParams.has(CONNECT_QUERY)) return
  url.searchParams.delete(CONNECT_QUERY)
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
