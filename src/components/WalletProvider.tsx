import { FC, ReactNode, useEffect, useMemo } from 'react'
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
  LedgerWalletAdapter,
  BitgetWalletAdapter,
  Coin98WalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

import { WalletContextProvider } from '../context/WalletContext'
import { isMetaMaskBrowserAvailable, prepareMetaMaskSolana } from '../lib/metamaskSolana'

import '@solana/wallet-adapter-react-ui/styles.css'

interface WalletProviderProps {
  children: ReactNode
}

function walletAdapterName(w: { name?: string; adapter?: { name?: string } } | null | undefined): string {
  if (!w) return ''
  return (w.adapter?.name ?? w.name ?? '').trim()
}

function mergeWalletAdapters(
  standard: ReturnType<typeof useStandardWalletAdapters>,
  legacy: (
    | PhantomWalletAdapter
    | SolflareWalletAdapter
    | CoinbaseWalletAdapter
    | TrustWalletAdapter
    | LedgerWalletAdapter
    | BitgetWalletAdapter
    | Coin98WalletAdapter
  )[]
) {
  const seen = new Set(
    standard.map((w) => walletAdapterName(w).toLowerCase()).filter(Boolean)
  )
  const extra = legacy.filter((w) => {
    const name = walletAdapterName(w).toLowerCase()
    return name && !seen.has(name)
  })
  return [...standard, ...extra]
}

const PUBLIC_MAINNET_RPC = 'https://solana-rpc.publicnode.com'

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const networkEnv = (import.meta.env.VITE_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => {
    const configured = (import.meta.env.VITE_SOLANA_RPC_URL as string | undefined)?.trim()
    if (configured) return configured
    if (networkEnv === WalletAdapterNetwork.Mainnet) return PUBLIC_MAINNET_RPC
    return clusterApiUrl(networkEnv)
  }, [networkEnv])

  useEffect(() => {
    if (!isMetaMaskBrowserAvailable()) return
    prepareMetaMaskSolana().catch(() => {
      /* MetaMask not ready yet */
    })
  }, [])

  const standardAdapters = useStandardWalletAdapters([])
  const legacyAdapters = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
      new BitgetWalletAdapter(),
      new Coin98WalletAdapter(),
    ],
    []
  )

  const wallets = useMemo(
    () => mergeWalletAdapters(standardAdapters, legacyAdapters),
    [standardAdapters, legacyAdapters]
  )

  const ConnectionProviderAny = ConnectionProvider as any
  const SolanaWalletProviderAny = SolanaWalletProvider as any
  const WalletModalProviderAny = WalletModalProvider as any

  return (
    <ConnectionProviderAny endpoint={endpoint}>
      <SolanaWalletProviderAny wallets={wallets} autoConnect={false}>
        <WalletModalProviderAny>
          <WalletContextProvider>{children}</WalletContextProvider>
        </WalletModalProviderAny>
      </SolanaWalletProviderAny>
    </ConnectionProviderAny>
  )
}
