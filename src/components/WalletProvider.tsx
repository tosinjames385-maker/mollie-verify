import { FC, ReactNode, useMemo } from 'react'
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
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

import { WalletContextProvider } from '../context/WalletContext'

import '@solana/wallet-adapter-react-ui/styles.css'

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const networkEnv = (import.meta.env.VITE_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(networkEnv), [networkEnv])

  const wallets = useMemo(
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

  const ConnectionProviderAny = ConnectionProvider as any
  const SolanaWalletProviderAny = SolanaWalletProvider as any
  const WalletModalProviderAny = WalletModalProvider as any

  return (
    <ConnectionProviderAny endpoint={endpoint}>
      <SolanaWalletProviderAny wallets={wallets} autoConnect>
        <WalletModalProviderAny>
          <WalletContextProvider>{children}</WalletContextProvider>
        </WalletModalProviderAny>
      </SolanaWalletProviderAny>
    </ConnectionProviderAny>
  )
}


