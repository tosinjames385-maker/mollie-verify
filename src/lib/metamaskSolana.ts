import { getDefaultTransport, getMultichainClient } from '@metamask/multichain-api-client'
import { registerSolanaWalletStandard } from '@metamask/solana-wallet-standard'

let registerPromise: Promise<void> | null = null

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

export function getMetaMaskEthereum(): EthereumLike | null {
  const eth = getWindowEthereum()
  if (!eth) return null
  if (Array.isArray(eth.providers) && eth.providers.length) {
    return eth.providers.find((p) => p.isMetaMask && !p.isBraveWallet) ?? null
  }
  if (eth.isMetaMask && !eth.isBraveWallet) return eth
  return null
}

export function isMetaMaskBrowserAvailable(): boolean {
  return Boolean(getMetaMaskEthereum())
}

/** Ask MetaMask to connect this site, then register Solana Wallet Standard. */
export async function prepareMetaMaskSolana(): Promise<void> {
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
