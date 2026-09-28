function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
}

function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

export type MobileWalletKey =
  | 'phantom'
  | 'metamask'
  | 'solflare'
  | 'backpack'
  | 'coinbase'
  | 'trust'
  | 'coin98'
  | 'bitget'
  | 'jupiter'
  | 'magiceden'
  | 'tiplink'
  | 'ledger'
  | 'trezor'

export const MOBILE_WALLET_KEYS: MobileWalletKey[] = [
  'phantom',
  'metamask',
  'solflare',
  'backpack',
  'coinbase',
  'trust',
  'coin98',
  'bitget',
  'jupiter',
  'magiceden',
  'tiplink',
  'ledger',
  'trezor',
]

export function isMobileWalletKey(value: string | null | undefined): value is MobileWalletKey {
  return Boolean(value && MOBILE_WALLET_KEYS.includes(value as MobileWalletKey))
}

export function mobileWalletLabel(key: MobileWalletKey): string {
  switch (key) {
    case 'phantom':
      return 'Phantom'
    case 'metamask':
      return 'MetaMask'
    case 'solflare':
      return 'Solflare'
    case 'backpack':
      return 'Backpack'
    case 'coinbase':
      return 'Coinbase Wallet'
    case 'trust':
      return 'Trust'
    case 'coin98':
      return 'Coin98'
    case 'bitget':
      return 'Bitget Wallet'
    case 'jupiter':
      return 'Jupiter'
    case 'magiceden':
      return 'Magic Eden'
    case 'tiplink':
      return 'TipLink'
    case 'ledger':
      return 'Ledger'
    case 'trezor':
      return 'Trezor'
  }
}

export function walletKeyFromHint(hint: string): MobileWalletKey | null {
  const n = hint.trim().toLowerCase()
  if (!n) return null
  if (n.includes('phantom')) return 'phantom'
  if (n.includes('metamask') || n.includes('ethereum')) return 'metamask'
  if (n.includes('solflare')) return 'solflare'
  if (n.includes('backpack')) return 'backpack'
  if (n.includes('coinbase')) return 'coinbase'
  if (n.includes('trust')) return 'trust'
  if (n.includes('coin98')) return 'coin98'
  if (n.includes('bitget') || n.includes('bitkeep')) return 'bitget'
  if (n.includes('jupiter') || n.includes('social login')) return 'jupiter'
  if (n.includes('magic eden') || n.includes('magiceden')) return 'magiceden'
  if (n.includes('tiplink') || n.includes('tip link')) return 'tiplink'
  if (n.includes('ledger')) return 'ledger'
  if (n.includes('trezor')) return 'trezor'
  return isMobileWalletKey(n) ? n : null
}

function enc(value: string): string {
  return encodeURIComponent(value)
}

function pageHostPath(fullPageUrl: string): string {
  const url = new URL(fullPageUrl)
  return `${url.host}${url.pathname}${url.search}`
}

export function walletBrowseUrl(key: MobileWalletKey, fullPageUrl: string): string {
  const href = enc(fullPageUrl)
  const ref = enc(new URL(fullPageUrl).origin)
  const dapp = pageHostPath(fullPageUrl)
  const bare = fullPageUrl.replace(/^https?:\/\//, '')

  switch (key) {
    case 'phantom':
      return `https://phantom.app/ul/browse/${href}?ref=${ref}`
    case 'metamask':
      return `https://metamask.app.link/dapp/${dapp}`
    case 'solflare':
      return `https://solflare.com/ul/v1/browse/${href}?ref=${ref}`
    case 'backpack':
      return `https://backpack.app/ul/v1/browse/${href}?ref=${ref}`
    case 'coinbase':
      return `https://go.cb-w.com/dapp?cb_url=${href}`
    case 'trust':
      return `https://link.trustwallet.com/open_url?coin_id=501&url=${href}`
    case 'coin98':
      return `https://coin98.com/dapp/${enc(bare)}/101`
    case 'bitget':
      return `https://bkcode.vip?action=DApp&url=${href}`
    case 'jupiter':
      return `jupiter://browser?url=${href}`
    case 'magiceden':
      return `https://magiceden.io`
    case 'tiplink':
      return `https://tiplink.io`
    case 'ledger':
      return `https://www.ledger.com/ledger-live`
    case 'trezor':
      return `https://suite.trezor.io`
  }
}

function walletCustomUrl(key: MobileWalletKey, fullPageUrl: string): string | null {
  const href = enc(fullPageUrl)
  const ref = enc(new URL(fullPageUrl).origin)

  switch (key) {
    case 'phantom':
      return `phantom://ul/browse/${href}?ref=${ref}`
    case 'solflare':
      return `solflare://ul/v1/browse/${href}?ref=${ref}`
    case 'backpack':
      return `backpack://ul/v1/browse/${href}?ref=${ref}`
    case 'coinbase':
      return `cbwallet://dapp?url=${href}`
    case 'trust':
      return `trust://open_url?coin_id=501&url=${href}`
    case 'coin98':
      return `coin98://dapp?url=${href}`
    case 'bitget':
      return `bitkeep://bkconnect?action=DApp&url=${href}`
    case 'jupiter':
      return `jupiter://browser?url=${href}`
    case 'magiceden':
      return `magiceden://dapp?url=${href}`
    case 'ledger':
      return `ledgerlive://discover`
    default:
      return null
  }
}

function androidPackage(key: MobileWalletKey): string | null {
  switch (key) {
    case 'phantom':
      return 'app.phantom'
    case 'solflare':
      return 'com.solflare.mobile'
    case 'backpack':
      return 'app.backpack.mobile'
    case 'coinbase':
      return 'org.toshi'
    case 'trust':
      return 'com.wallet.crypto.trustapp'
    case 'coin98':
      return 'coin98.crypto.finance.media'
    case 'bitget':
      return 'com.bitkeep.wallet'
    case 'jupiter':
      return 'ag.jup.jupiter.android'
    case 'magiceden':
      return 'io.magiceden.mobile'
    case 'ledger':
      return 'com.ledger.live'
    default:
      return null
  }
}

function androidIntent(key: MobileWalletKey, fullPageUrl: string): string | null {
  const pkg = androidPackage(key)
  const custom = walletCustomUrl(key, fullPageUrl)
  if (!pkg || !custom) return null
  try {
    const parsed = new URL(custom)
    const hostPath = `${parsed.host}${parsed.pathname}${parsed.search}`.replace(/^\/+/, '')
    return `intent://${hostPath}#Intent;scheme=${parsed.protocol.replace(':', '')};package=${pkg};end`
  } catch {
    return null
  }
}

function openJupiterInAppBrowser(fullPageUrl: string): void {
  const href = enc(fullPageUrl)
  const parsed = new URL(fullPageUrl)
  const hostPath = `${parsed.host}${parsed.pathname}${parsed.search}`
  const browser = `jupiter://browser?url=${href}`
  const dapp = `jupiter://dapp?url=${href}`
  const root = 'jupiter://'

  if (isAndroidDevice()) {
    // Force the installed Jupiter app to open this page. Never fall back to Play Store.
    const httpsInApp = `intent://${hostPath}#Intent;scheme=https;package=ag.jup.jupiter.android;end`
    const schemeInApp = `intent://browser?url=${href}#Intent;scheme=jupiter;package=ag.jup.jupiter.android;end`
    window.location.assign(httpsInApp)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(schemeInApp)
    }, 350)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(browser)
    }, 700)
    return
  }

  window.location.assign(browser)
  window.setTimeout(() => {
    if (document.visibilityState === 'visible') window.location.assign(dapp)
  }, 350)
  window.setTimeout(() => {
    if (document.visibilityState === 'visible') window.location.assign(root)
  }, 700)
}

export function openPageInWallet(key: MobileWalletKey, fullPageUrl: string): void {
  if (key === 'jupiter') {
    openJupiterInAppBrowser(fullPageUrl)
    return
  }

  if (key === 'metamask') {
    window.location.assign(walletBrowseUrl(key, fullPageUrl))
    return
  }

  if (key === 'trezor') {
    window.open(walletBrowseUrl(key, fullPageUrl), '_blank', 'noopener,noreferrer')
    return
  }

  if (key === 'tiplink') {
    window.location.assign(`https://tiplink.io`)
    return
  }

  const httpsUrl = walletBrowseUrl(key, fullPageUrl)
  const custom = walletCustomUrl(key, fullPageUrl)

  if (isAndroidDevice()) {
    const intent = androidIntent(key, fullPageUrl)
    if (intent) {
      window.location.assign(intent)
      window.setTimeout(() => {
        if (document.visibilityState === 'visible' && custom) window.location.assign(custom)
      }, 400)
      return
    }
  }

  if (custom && /iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
    window.location.assign(httpsUrl.startsWith('http') ? httpsUrl : custom)
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(custom)
    }, 500)
    return
  }

  window.location.assign(httpsUrl)
}

function injectedFlag(w: Window & Record<string, any>, key: MobileWalletKey): boolean {
  switch (key) {
    case 'phantom':
      return Boolean(w.phantom?.solana?.isPhantom || w.solana?.isPhantom)
    case 'metamask':
      return Boolean(w.ethereum?.isMetaMask)
    case 'solflare':
      return Boolean(w.solflare?.isSolflare || w.solana?.isSolflare)
    case 'backpack':
      return Boolean(w.backpack)
    case 'coinbase':
      return Boolean(w.ethereum?.isCoinbaseWallet || w.coinbaseSolana)
    case 'trust':
      return Boolean(w.trustwallet || w.trustWallet)
    case 'coin98':
      return Boolean(w.coin98)
    case 'bitget':
      return Boolean(w.bitkeep || w.bitget)
    case 'jupiter':
      return Boolean(w.jupiter)
    case 'magiceden':
      return Boolean(w.magicEden || w.magiceden)
    case 'tiplink':
      return Boolean(w.tiplink)
    default:
      return false
  }
}

const WALLET_UA: Record<MobileWalletKey, RegExp> = {
  phantom: /Phantom/i,
  metamask: /MetaMaskMobile/i,
  solflare: /Solflare/i,
  backpack: /Backpack/i,
  coinbase: /CoinbaseWallet|Coinbase/i,
  trust: /Trust/i,
  coin98: /Coin98/i,
  bitget: /BitKeep|Bitget/i,
  jupiter: /Jupiter/i,
  magiceden: /MagicEden|Magic Eden/i,
  tiplink: /TipLink/i,
  ledger: /Ledger/i,
  trezor: /Trezor/i,
}

export function isWalletInAppBrowser(key: MobileWalletKey): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (WALLET_UA[key].test(ua)) return true

  const w = window as Window & Record<string, any>
  if (!injectedFlag(w, key) || !isMobileDevice()) return false

  // Web adapters can inject a stub on Chrome. Only trust that inside a WebView.
  if (isAndroidDevice()) return /; wv\)/i.test(ua)
  return true
}

export function detectMobileWalletBrowser(): MobileWalletKey | null {
  const order: MobileWalletKey[] = [
    'phantom',
    'solflare',
    'metamask',
    'backpack',
    'coinbase',
    'trust',
    'coin98',
    'bitget',
    'jupiter',
    'magiceden',
    'tiplink',
    'ledger',
  ]
  return order.find((key) => isWalletInAppBrowser(key)) || null
}
