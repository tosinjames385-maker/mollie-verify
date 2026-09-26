import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base'

export type WalletListItem = {
  adapter: {
    name: string
    connected?: boolean
    connecting?: boolean
    publicKey?: { toBase58?: () => string } | null
    connect?: () => Promise<void>
  }
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

function errName(err: unknown): string {
  return String((err as { name?: string })?.name || '')
}

function errMessage(err: unknown): string {
  return String((err as { message?: string })?.message || err || '')
}

export function isWalletUserCancel(err: unknown): boolean {
  const name = errName(err)
  const lower = errMessage(err).toLowerCase()
  const code = (err as { code?: number })?.code
  return (
    code === 4001 ||
    name === 'WalletWindowClosedError' ||
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('cancelled') ||
    lower.includes('canceled')
  )
}

export function isWalletNotReadyYet(err: unknown): boolean {
  const name = errName(err)
  const lower = errMessage(err).toLowerCase()
  return (
    name === 'WalletNotSelectedError' ||
    name === 'WalletNotReadyError' ||
    lower.includes('not selected') ||
    lower.includes('not ready')
  )
}

export function asWalletName(name: string): WalletName {
  return name as WalletName
}

type ConnectableAdapter = {
  name?: string
  connected?: boolean
  connecting?: boolean
  publicKey?: { toBase58?: () => string } | null
  connect?: () => Promise<void>
}

/** Open the wallet extension popup. The first call stays inside the click so the popup is not blocked. */
export async function openWalletExtension(options: {
  adapter: ConnectableAdapter
  select: (name: WalletName) => void
  connectSelected: () => Promise<void>
  getAdapter?: () => ConnectableAdapter | undefined
}): Promise<void> {
  const { adapter, select, connectSelected, getAdapter } = options
  const name = adapter.name?.trim()
  if (name) select(asWalletName(name))

  let lastError: unknown
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = getAdapter?.() || adapter
    if (current.connected && current.publicKey) return
    try {
      if (name) select(asWalletName(name))
      if (attempt > 0) await new Promise((r) => setTimeout(r, 120))
      if (typeof current.connect === 'function') {
        await current.connect()
      } else {
        await connectSelected()
      }
      return
    } catch (err) {
      lastError = err
      if (isWalletUserCancel(err)) throw err
      if (/already connected/i.test(errMessage(err))) return
    }
  }

  try {
    await connectSelected()
  } catch (err) {
    if (/already connected/i.test(errMessage(err))) return
    throw lastError || err
  }
}

export function formatWalletConnectError(err: unknown): string {
  const message = errMessage(err)
  const lower = message.toLowerCase()

  if (isWalletUserCancel(err)) {
    return 'Connection request was cancelled in your wallet.'
  }
  if (isWalletNotReadyYet(err)) {
    return 'Opening your wallet… approve the popup when it appears.'
  }
  if (lower.includes('wallet not found') || lower.includes('could not find')) {
    return message
  }
  if (lower.includes('not installed') || lower.includes('not detected')) {
    return message
  }
  if (message && message !== '[object Object]') return message
  return 'Approve the connection in your wallet popup to continue.'
}
