import { getDefaultTransport, getMultichainClient } from '@metamask/multichain-api-client'
import { registerSolanaWalletStandard } from '@metamask/solana-wallet-standard'

let registerPromise: Promise<void> | null = null
let eip6963MetaMask: EthereumLike | null = null
let eip6963Listening = false

type EthereumLike = {
  isMetaMask?: boolean
  isBraveWallet?: boolean
  providers?: EthereumLike[]
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getWindowEthereum(): EthereumLike | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { ethereum?: EthereumLike }).ethereum
}

function isMetaMaskProvider(provider?: EthereumLike | null): boolean {
  if (!provider) return false
  if (provider.isBraveWallet && !provider.isMetaMask) return false
  return Boolean(provider.isMetaMask || provider.request)
}

function listenForEip6963(): void {
  if (typeof window === 'undefined' || eip6963Listening) return
  eip6963Listening = true
  window.addEventListener('eip6963:announceProvider', ((event: Event) => {
    const detail = (event as CustomEvent).detail as {
      info?: { rdns?: string; name?: string }
      provider?: EthereumLike
    }
    const rdns = detail?.info?.rdns?.toLowerCase() || ''
    const name = detail?.info?.name?.toLowerCase() || ''
    if (rdns.includes('io.metamask') || name.includes('metamask')) {
      eip6963MetaMask = detail.provider || null
    }
  }) as EventListener)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

listenForEip6963()

export function getMetaMaskEthereum(): EthereumLike | null {
  listenForEip6963()
  if (eip6963MetaMask) return eip6963MetaMask

  const eth = getWindowEthereum()
  if (!eth) return null

  if (Array.isArray(eth.providers) && eth.providers.length) {
    const match =
      eth.providers.find((p) => p.isMetaMask && !p.isBraveWallet) ||
      eth.providers.find((p) => p.isMetaMask) ||
      eth.providers.find((p) => p.request)
    if (match) return match
  }

  if (eth.isMetaMask) return eth
  if (eth.request) return eth
  return null
}

export function isMetaMaskBrowserAvailable(): boolean {
  listenForEip6963()
  if (eip6963MetaMask) return true
  const eth = getWindowEthereum()
  if (!eth) return false
  if (eth.isMetaMask) return true
  if (Array.isArray(eth.providers) && eth.providers.some((p) => p.isMetaMask || p.request)) return true
  return Boolean(eth.request)
}

/** Ask MetaMask to connect this site, then register Solana Wallet Standard. */
export async function prepareMetaMaskSolana(): Promise<void> {
  listenForEip6963()
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  await new Promise((r) => setTimeout(r, 80))

  const mm = getMetaMaskEthereum()
  if (mm?.request) {
    try {
      await mm.request({ method: 'eth_requestAccounts' })
    } catch (err) {
      const code = (err as { code?: number }).code
      if (code === 4001) {
        throw new Error('Connection request was cancelled in your wallet.')
      }
    }
  }
  await ensureMetaMaskSolanaRegistered()
}

/** Registers MetaMask as a Solana Wallet Standard wallet. */
export function ensureMetaMaskSolanaRegistered(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (!registerPromise) {
    registerPromise = (async () => {
      const client = getMultichainClient({ transport: getDefaultTransport() })
      await registerSolanaWalletStandard({ client, walletName: 'MetaMask' })
    })().catch((err) => {
      registerPromise = null
      console.warn('[MetaMask Solana] Registration failed:', err)
      throw err
    })
  }
  return registerPromise
}
