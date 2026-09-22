import { WalletReadyState } from '@solana/wallet-adapter-base'
import type { WalletListItem } from './walletConnectHelpers'
import { getWalletAdapterName, isWalletConnectable } from './walletConnectHelpers'

export type DetectedWalletTile = {
  name: string
  adapterName: string
  icon: string
  url?: string
  showSolanaBadge?: boolean
}

const RECENT_KEY = 'vrfd_recent_wallets'

const KNOWN: Record<string, { name: string; icon: string; url?: string; showSolanaBadge?: boolean }> = {
  metamask: { name: 'MetaMask', icon: 'metamask', url: 'https://metamask.io', showSolanaBadge: true },
  phantom: { name: 'Phantom', icon: 'phantom', url: 'https://phantom.app' },
  brave: { name: 'Brave Wallet', icon: 'brave', url: 'https://brave.com/wallet/' },
  solflare: { name: 'Solflare', icon: 'solflare', url: 'https://solflare.com' },
  backpack: { name: 'Backpack', icon: 'backpack', url: 'https://backpack.app' },
  coinbase: { name: 'Coinbase Wallet', icon: 'coinbase', url: 'https://www.coinbase.com/wallet' },
  trust: { name: 'Trust', icon: 'trust', url: 'https://trustwallet.com' },
  ledger: { name: 'Ledger', icon: 'ledger', url: 'https://ledger.com' },
  bitget: { name: 'Bitget Wallet', icon: 'bitget', url: 'https://web3.bitget.com' },
  coin98: { name: 'Coin98', icon: 'coin98', url: 'https://coin98.com' },
}

function catalogKeyFromName(name: string): string | null {
  const n = name.toLowerCase()
  if (n.includes('metamask') || n.includes('ethereum')) return 'metamask'
  if (n.includes('phantom')) return 'phantom'
  if (n.includes('brave')) return 'brave'
  if (n.includes('solflare')) return 'solflare'
  if (n.includes('backpack')) return 'backpack'
  if (n.includes('coinbase')) return 'coinbase'
  if (n.includes('trust')) return 'trust'
  if (n.includes('ledger')) return 'ledger'
  if (n.includes('bitget')) return 'bitget'
  if (n.includes('coin98')) return 'coin98'
  return null
}

function tileFromKey(key: string): DetectedWalletTile | null {
  const meta = KNOWN[key]
  if (!meta) return null
  return {
    name: meta.name,
    adapterName: meta.name,
    icon: meta.icon,
    url: meta.url,
    showSolanaBadge: meta.showSolanaBadge,
  }
}

function detectFromWindow(): string[] {
  if (typeof window === 'undefined') return []
  const w = window as Window & {
    ethereum?: { isMetaMask?: boolean; isCoinbaseWallet?: boolean; isBraveWallet?: boolean }
    solana?: { isPhantom?: boolean; isBraveWallet?: boolean }
    phantom?: { solana?: unknown }
    solflare?: unknown
    backpack?: unknown
    braveSolana?: unknown
    coinbaseSolana?: unknown
    trustwallet?: unknown
  }
  const found: string[] = []
  if (w.ethereum?.isMetaMask && !w.ethereum?.isBraveWallet) found.push('metamask')
  if (w.phantom?.solana || w.solana?.isPhantom) found.push('phantom')
  if (w.ethereum?.isBraveWallet || w.solana?.isBraveWallet || w.braveSolana || 'brave' in navigator) {
    found.push('brave')
  }
  if (w.solflare) found.push('solflare')
  if (w.backpack) found.push('backpack')
  if (w.ethereum?.isCoinbaseWallet || w.coinbaseSolana) found.push('coinbase')
  if (w.trustwallet) found.push('trust')
  return found
}

export function rememberRecentWallet(name: string): void {
  const key = catalogKeyFromName(name)
  if (!key || typeof window === 'undefined') return
  try {
    const prev = getRecentWalletKeys().filter((k) => k !== key)
    localStorage.setItem(RECENT_KEY, JSON.stringify([key, ...prev].slice(0, 4)))
  } catch {
    /* ignore */
  }
}

export function getRecentWalletKeys(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []
  } catch {
    return []
  }
}

/** Installed wallets detected in this browser (adapters + injected providers). */
export function detectInstalledWallets(wallets: WalletListItem[]): DetectedWalletTile[] {
  const keys = new Set<string>()

  for (const k of detectFromWindow()) keys.add(k)

  for (const entry of wallets) {
    if (!isWalletConnectable(entry) && entry.readyState !== WalletReadyState.Installed) continue
    if (
      entry.readyState !== WalletReadyState.Installed &&
      entry.readyState !== WalletReadyState.Loadable
    ) {
      continue
    }
    const key = catalogKeyFromName(getWalletAdapterName(entry))
    if (key) keys.add(key)
  }

  return Array.from(keys)
    .map(tileFromKey)
    .filter((t): t is DetectedWalletTile => Boolean(t))
}

export function splitRecentAndInstalled(installed: DetectedWalletTile[]): {
  recent: DetectedWalletTile[]
  installed: DetectedWalletTile[]
} {
  const recentKeys = getRecentWalletKeys()
  const byKey = new Map(installed.map((t) => [catalogKeyFromName(t.adapterName) || t.icon, t]))
  const recent = recentKeys.map((k) => byKey.get(k)).filter((t): t is DetectedWalletTile => Boolean(t))
  const recentSet = new Set(recent.map((t) => t.adapterName))
  const rest = installed.filter((t) => !recentSet.has(t.adapterName))
  return { recent, installed: rest }
}
