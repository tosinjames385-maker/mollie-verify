import { isMetaMaskInAppBrowser, isMobileDevice, isPhantomInAppBrowser } from './mobileWallet'

export function isGenericEmbeddedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /WebView|wv\)|FBAN|FBAV|Instagram|Line\//i.test(ua)
}

/** Wallet or embedded in-app browsers where X login often breaks. */
export function isRestrictedAuthBrowser(): boolean {
  return (
    isPhantomInAppBrowser() ||
    isMetaMaskInAppBrowser() ||
    (isMobileDevice() && isGenericEmbeddedBrowser())
  )
}

/** Try to open a URL in the device browser (Safari / Chrome). */
export function openInSystemBrowser(url: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) {
      opened.opener = null
      return true
    }
  } catch {
    /* ignore */
  }

  if (/Android/i.test(navigator.userAgent || '')) {
    try {
      const parsed = new URL(url)
      window.location.assign(
        `intent://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}#Intent;scheme=https;action=android.intent.action.VIEW;end`
      )
      return true
    } catch {
      /* fall through */
    }
  }

  try {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    return true
  } catch {
    window.location.assign(url)
    return true
  }
}
