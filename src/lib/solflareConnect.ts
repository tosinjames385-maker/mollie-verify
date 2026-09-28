type SolflareProvider = {
  isSolflare?: boolean
  isConnected?: boolean
  publicKey?: { toString?: () => string; toBase58?: () => string } | null
  connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: { toString?: () => string } } | void>
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function getSolflareProvider(): SolflareProvider | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    solflare?: SolflareProvider
    solana?: SolflareProvider
  }
  if (w.solflare?.isSolflare || w.solflare?.connect) return w.solflare
  if (w.solana?.isSolflare) return w.solana
  return null
}

export function readSolflareAddress(provider = getSolflareProvider()): string {
  const key = provider?.publicKey
  return key?.toBase58?.() || key?.toString?.() || ''
}

export async function waitForSolflareProvider(maxWaitMs = 8000): Promise<SolflareProvider | null> {
  const started = Date.now()
  while (Date.now() - started < maxWaitMs) {
    const provider = getSolflareProvider()
    if (provider) return provider
    await sleep(120)
  }
  return getSolflareProvider()
}

export async function connectSolflareNative(): Promise<string> {
  const provider = (await waitForSolflareProvider(6000)) || getSolflareProvider()
  if (!provider?.connect) {
    throw new Error('Solflare is not available in this browser yet. Open this page inside Solflare and try again.')
  }

  if (provider.isConnected) {
    const existing = readSolflareAddress(provider)
    if (existing) return existing
  }

  const result = await provider.connect({ onlyIfTrusted: false })
  const fromResult = result && typeof result === 'object' ? result.publicKey?.toString?.() || '' : ''
  return fromResult || readSolflareAddress(provider)
}
