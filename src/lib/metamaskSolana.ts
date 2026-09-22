import { getDefaultTransport, getMultichainClient } from '@metamask/multichain-api-client'
import { registerSolanaWalletStandard } from '@metamask/solana-wallet-standard'

let registerPromise: Promise<void> | null = null

/** Registers MetaMask as a Solana Wallet Standard wallet (opens MetaMask connect popup). */
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

export function isMetaMaskBrowserAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const eth = (window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum
  return Boolean(eth?.isMetaMask)
}
