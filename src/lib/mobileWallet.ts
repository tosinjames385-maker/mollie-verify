const PENDING_KEY = 'vrfd_pending_mobile_wallet'

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true
  return navigator.maxTouchPoints > 1 && /Mac/i.test(ua) && !/Macintosh.*Chrome/i.test(ua)
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

function currentDappPath(href = window.location.href): string {
  const url = new URL(href)
  return `${url.host}${url.pathname}${url.search}`
}

/** Opens this page inside MetaMask’s in-app browser (required on phones). */
export function openCurrentPageInMetaMask(): void {
  const dapp = currentDappPath()
  const universal = `https://metamask.app.link/dapp/${dapp}`
  const alt = `https://link.metamask.io/dapp/${dapp}`
  window.location.assign(universal)
  window.setTimeout(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      window.location.assign(alt)
    }
  }, 1400)
}

export function openCurrentPageInPhantom(): void {
  const href = encodeURIComponent(window.location.href)
  const ref = encodeURIComponent(window.location.origin)
  window.location.assign(`https://phantom.app/ul/browse/${href}?ref=${ref}`)
}

export function markPendingMobileWallet(name: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, name)
  } catch {
    /* ignore */
  }
}

export function getPendingMobileWallet(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

export function clearPendingMobileWallet(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
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
