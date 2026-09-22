import { WalletReadyState } from '@solana/wallet-adapter-base'

export type WalletListItem = {
  adapter: { name: string; connected?: boolean; publicKey?: { toBase58?: () => string } | null }
  readyState: WalletReadyState
}

export function getWalletAdapterName(entry: WalletListItem | null | undefined): string {
  return entry?.adapter?.name?.trim() ?? ''
}

/** Match sidebar labels to installed adapters (MetaMask, Phantom, …). */
export function findWalletByHint(wallets: WalletListItem[], hint: string): WalletListItem | undefined {
  const target = hint.trim().toLowerCase()
  if (!target) return undefined

  if (target.includes('metamask') || target.includes('ethereum')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('metamask'))
  }
  if (target.includes('phantom')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('phantom'))
  }
  if (target.includes('solflare')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('solflare'))
  }
  if (target.includes('coinbase')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('coinbase'))
  }
  if (target.includes('trust')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('trust'))
  }
  if (target.includes('backpack')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('backpack'))
  }
  if (target.includes('brave')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('brave'))
  }
  if (target.includes('ledger')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('ledger'))
  }
  if (target.includes('bitget')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('bitget'))
  }
  if (target.includes('coin98')) {
    return wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes('coin98'))
  }

  return (
    wallets.find((w) => getWalletAdapterName(w).toLowerCase() === target) ||
    wallets.find((w) => getWalletAdapterName(w).toLowerCase().includes(target))
  )
}

export function isWalletConnectable(entry: WalletListItem | undefined): boolean {
  if (!entry) return false
  return (
    entry.readyState === WalletReadyState.Installed ||
    entry.readyState === WalletReadyState.Loadable
  )
}

export async function waitForWalletByHint(
  getWallets: () => WalletListItem[],
  hint: string,
  maxWaitMs = 4000
): Promise<WalletListItem | undefined> {
  const started = Date.now()
  while (Date.now() - started < maxWaitMs) {
    const found = findWalletByHint(getWallets(), hint)
    if (found && isWalletConnectable(found)) return found
    await new Promise((r) => setTimeout(r, 120))
  }
  return findWalletByHint(getWallets(), hint)
}

export function formatWalletConnectError(err: unknown): string {
  const e = err as { name?: string; message?: string }
  const message = e?.message || ''
  const lower = message.toLowerCase()

  if (
    e?.name === 'WalletConnectionError' ||
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('cancelled') ||
    lower.includes('canceled')
  ) {
    return 'Connection request was cancelled in your wallet.'
  }
  if (lower.includes('wallet not found') || lower.includes('could not find')) {
    return message
  }
  if (lower.includes('not installed') || lower.includes('not detected')) {
    return message
  }
  if (message) return message
  return 'Failed to connect wallet. Open your extension and approve the connection, or try another wallet.'
}
