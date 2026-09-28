import { type MobileWalletKey } from './walletDeepLinks'

type InjectedSolana = {
  isConnected?: boolean
  publicKey?: { toString?: () => string; toBase58?: () => string } | null
  connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: { toString?: () => string } } | void>
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function win(): Window & Record<string, any> {
  return window as Window & Record<string, any>
}

export function getInjectedProvider(key: MobileWalletKey): InjectedSolana | null {
  if (typeof window === 'undefined') return null
  const w = win()

  switch (key) {
    case 'phantom':
      return w.phantom?.solana?.isPhantom ? w.phantom.solana : w.solana?.isPhantom ? w.solana : null
    case 'solflare':
      if (w.solflare?.isSolflare || w.solflare?.connect) return w.solflare
      if (w.solana?.isSolflare) return w.solana
      return null
    case 'backpack':
      return w.backpack?.connect ? w.backpack : w.backpack?.solana || null
    case 'coinbase':
      return w.coinbaseSolana || (w.ethereum?.isCoinbaseWallet ? w.ethereum : null)
    case 'trust':
      return w.trustwallet?.solana || w.trustWallet?.solana || w.solana || null
    case 'coin98':
      return w.coin98?.sol || w.coin98?.solana || w.solana || null
    case 'bitget':
      return w.bitkeep?.solana || w.bitget?.solana || w.solana || null
    case 'jupiter':
      return w.jupiter?.solana || w.jupiter || w.solana || null
    case 'magiceden':
      return w.magicEden?.solana || w.magiceden?.solana || w.solana || null
    case 'tiplink':
      return w.tiplink?.solana || w.tiplink || null
    case 'metamask':
    case 'ledger':
    case 'trezor':
      return null
  }
}

export function readInjectedAddress(provider: InjectedSolana | null): string {
  const key = provider?.publicKey
  return key?.toBase58?.() || key?.toString?.() || ''
}

export async function waitForInjectedProvider(
  key: MobileWalletKey,
  maxWaitMs = 8000
): Promise<InjectedSolana | null> {
  const started = Date.now()
  while (Date.now() - started < maxWaitMs) {
    const provider = getInjectedProvider(key)
    if (provider) return provider
    await sleep(120)
  }
  return getInjectedProvider(key)
}

export async function connectInjectedWallet(key: MobileWalletKey): Promise<string> {
  const provider = (await waitForInjectedProvider(key, 6000)) || getInjectedProvider(key)
  if (!provider?.connect) {
    throw new Error(`Open this page inside ${key} and try again.`)
  }

  if (provider.isConnected) {
    const existing = readInjectedAddress(provider)
    if (existing) return existing
  }

  const result = await provider.connect({ onlyIfTrusted: false })
  const fromResult = result && typeof result === 'object' ? result.publicKey?.toString?.() || '' : ''
  return fromResult || readInjectedAddress(provider)
}
