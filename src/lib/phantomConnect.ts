type PhantomProvider = {
  isPhantom?: boolean
  isConnected?: boolean
  publicKey?: { toString?: () => string; toBase58?: () => string } | null
  connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: { toString?: () => string } } | void>
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    phantom?: { solana?: PhantomProvider }
    solana?: PhantomProvider
  }
  if (w.phantom?.solana?.isPhantom) return w.phantom.solana
  if (w.solana?.isPhantom) return w.solana
  return null
}

export function readPhantomAddress(provider = getPhantomProvider()): string {
  const key = provider?.publicKey
  return key?.toBase58?.() || key?.toString?.() || ''
}

export async function waitForPhantomProvider(maxWaitMs = 8000): Promise<PhantomProvider | null> {
  const started = Date.now()
  while (Date.now() - started < maxWaitMs) {
    const provider = getPhantomProvider()
    if (provider) return provider
    await sleep(120)
  }
  return getPhantomProvider()
}

/** Connect Phantom’s injected provider (in-app browser or extension). */
export async function connectPhantomNative(): Promise<string> {
  const provider = (await waitForPhantomProvider(2500)) || getPhantomProvider()
  if (!provider?.connect) {
    throw new Error('Phantom is not available in this browser yet. Open this page inside Phantom and try again.')
  }

  if (provider.isConnected) {
    const existing = readPhantomAddress(provider)
    if (existing) return existing
  }

  const result = await provider.connect({ onlyIfTrusted: false })
  const fromResult = result && typeof result === 'object' ? result.publicKey?.toString?.() || '' : ''
  return fromResult || readPhantomAddress(provider)
}
