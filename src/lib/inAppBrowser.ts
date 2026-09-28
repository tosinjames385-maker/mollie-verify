import { isMetaMaskInAppBrowser, isMobileDevice, isPhantomInAppBrowser, isSolflareInAppBrowser } from './mobileWallet'

export function isGenericEmbeddedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /WebView|wv\)|FBAN|FBAV|Instagram|Line\//i.test(ua)
}

export function isNamedWalletBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Phantom|MetaMask|Trust|Solflare|CoinbaseWallet|Rainbow|Exodus|Backpack|OKX|Coin98|BitKeep|Bitget|Jupiter|MagicEden|TipLink|Ledger/i.test(ua)
}

/** Wallet or embedded in-app browsers where X login often breaks. */
export function isRestrictedAuthBrowser(): boolean {
  return (
    isPhantomInAppBrowser() ||
    isSolflareInAppBrowser() ||
    isMetaMaskInAppBrowser() ||
    isNamedWalletBrowser() ||
    (isMobileDevice() && isGenericEmbeddedBrowser())
  )
}

/** Try to open a URL in the device browser (Safari / Chrome). */
export function openInSystemBrowser(url: string): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  let parsed: URL
  try {
    parsed = new URL(url, window.location.origin)
  } catch {
    window.location.assign(url)
    return true
  }

  const href = parsed.toString()

  if (isIOS) {
    // Wallet WebViews swallow x.com OAuth. Force Safari, then fall back.
    window.location.assign(`x-safari-https://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`)
    window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      try {
        const opened = window.open(href, '_blank', 'noopener,noreferrer')
        if (opened) {
          opened.opener = null
          return
        }
      } catch {
        /* ignore */
      }
      window.location.assign(href)
    }, 350)
    return true
  }

  if (isAndroid) {
    window.location.assign(
      `intent://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}#Intent;scheme=https;action=android.intent.action.VIEW;end`
    )
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(href)
    }, 500)
    return true
  }

  try {
    const opened = window.open(href, '_blank', 'noopener,noreferrer')
    if (opened) {
      opened.opener = null
      return true
    }
  } catch {
    /* ignore */
  }

  window.location.assign(href)
  return true
}
