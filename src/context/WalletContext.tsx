import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'
import toast from 'react-hot-toast'
import { walletApi } from '../lib/walletApi'

export interface WalletState {
  walletAddress: string | null
  shortAddress: string
  walletName: string | null
  walletIcon: string | null
  chain: string
  network: string
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  error: string | null
  balanceSol: number | null
  balanceLoading: boolean
  isVerified: boolean
  verifying: boolean
  isModalOpen: boolean
  // Action Handlers
  openWalletModal: () => void
  closeWalletModal: () => void
  connectWallet: (adapterName?: string) => Promise<void>
  disconnectWallet: () => Promise<void>
  signAndVerifyServer: () => Promise<boolean>
  refreshBalance: () => Promise<void>
  setError: (err: string | null) => void
  clearError: () => void
}

const WalletContext = createContext<WalletState | undefined>(undefined)

export const WalletContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection } = useConnection()
  const {
    wallets,
    select,
    connect,
    disconnect,
    connected,
    connecting,
    disconnecting,
    publicKey,
    wallet,
    signMessage,
  } = useWallet()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [balanceSol, setBalanceSol] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const walletAddress = useMemo(() => (publicKey ? publicKey.toBase58() : null), [publicKey])
  const shortAddress = useMemo(
    () => (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : ''),
    [walletAddress]
  )

  const network = (import.meta.env.VITE_SOLANA_NETWORK as string) || 'mainnet-beta'

  // Fetch real Solana RPC balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalanceSol(null)
      return
    }
    try {
      setBalanceLoading(true)
      const lamports = await connection.getBalance(publicKey, 'confirmed')
      setBalanceSol(lamports / LAMPORTS_PER_SOL)
    } catch (err: any) {
      console.warn('Solana RPC balance fetch error:', err)
      // Keep existing balance or set to 0 on network fault
    } finally {
      setBalanceLoading(false)
    }
  }, [publicKey, connection])

  // Sync connection state with server DB logging
  useEffect(() => {
    if (connected && publicKey && wallet) {
      setError(null)
      refreshBalance()

      // Log to backend
      walletApi.recordConnect({
        walletAddress: publicKey.toBase58(),
        walletType: wallet.adapter.name,
        chain: 'solana',
        network,
      })
    } else if (!connected) {
      setBalanceSol(null)
      setIsVerified(false)
    }
  }, [connected, publicKey, wallet, network, refreshBalance])

  // Listen for accountChanged event from window.solana / active extension
  useEffect(() => {
    if (typeof window === 'undefined') return

    const solanaWindow = (window as any).solana

    const handleAccountChange = (newPublicKey: any) => {
      if (newPublicKey) {
        const newAddress = newPublicKey.toBase58 ? newPublicKey.toBase58() : newPublicKey.toString()
        console.log('Real-time wallet account changed to:', newAddress)
        toast.success(`Account changed: ${newAddress.slice(0, 4)}...${newAddress.slice(-4)}`)
        refreshBalance()
        walletApi.recordConnect({
          walletAddress: newAddress,
          walletType: wallet?.adapter.name || 'Solana Wallet',
          chain: 'solana',
          network,
        })
      } else {
        console.log('Real-time wallet disconnected from extension')
        toast('Wallet disconnected in extension', { icon: 'ℹ️' })
        setBalanceSol(null)
        setIsVerified(false)
      }
    }

    if (solanaWindow && solanaWindow.on) {
      solanaWindow.on('accountChanged', handleAccountChange)
      return () => {
        if (solanaWindow.removeListener) {
          solanaWindow.removeListener('accountChanged', handleAccountChange)
        }
      }
    }
  }, [wallet, network, refreshBalance])

  const openWalletModal = () => setIsModalOpen(true)
  const closeWalletModal = () => setIsModalOpen(false)

  // Connect specific wallet by adapter name
  const connectWallet = async (adapterName?: string) => {
    setError(null)
    try {
      if (adapterName) {
        const target = wallets.find(
          (w) => w.adapter.name.toLowerCase() === adapterName.toLowerCase()
        )
        if (target) {
          if (
            target.readyState !== WalletReadyState.Installed &&
            target.readyState !== WalletReadyState.Loadable
          ) {
            const downloadUrl = (target.adapter as any).url || 'https://phantom.app'
            window.open(downloadUrl, '_blank')
            throw new Error(`${adapterName} extension is not installed in your browser. Opening official download link...`)
          }
          select(target.adapter.name)
          await new Promise((r) => setTimeout(r, 100))
        }
      }
      await connect()
      toast.success('Wallet connected successfully!')
      closeWalletModal()
    } catch (err: any) {
      const msg =
        err?.name === 'WalletConnectionError' ||
        err?.message?.toLowerCase().includes('user rejected') ||
        err?.message?.toLowerCase().includes('cancelled')
          ? 'Connection request was cancelled in your wallet.'
          : err?.message || 'Failed to connect wallet.'

      setError(msg)
      toast.error(msg)
      throw err
    }
  }

  // Disconnect active wallet
  const disconnectWallet = async () => {
    try {
      if (walletAddress) {
        await walletApi.recordDisconnect(walletAddress)
      }
      await disconnect()
      setBalanceSol(null)
      setIsVerified(false)
      setError(null)
      toast.success('Wallet disconnected')
    } catch (err: any) {
      toast.error('Failed to disconnect wallet')
    }
  }

  // Cryptographic server signature verification challenge
  const signAndVerifyServer = async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet does not support message signing or is not connected.')
      return false
    }

    try {
      setVerifying(true)
      // 1. Get session nonce from server
      const { nonce, messageToSign } = await walletApi.createSession()

      // 2. Request user to sign message in wallet
      const messageBytes = new TextEncoder().encode(messageToSign)
      const signatureBytes = await signMessage(messageBytes)
      const signatureBase58 = bs58.encode(signatureBytes)

      // 3. Post to backend for tweetnacl verification
      const verifyRes = await walletApi.verifySignature({
        publicKey: publicKey.toBase58(),
        signature: signatureBase58,
        nonce,
        message: messageToSign,
      })

      if (verifyRes.verified) {
        setIsVerified(true)
        toast.success('Wallet ownership cryptographically verified!')
        return true
      }
      return false
    } catch (err: any) {
      const msg = err?.message?.includes('User rejected')
        ? 'Signature request was rejected in your wallet.'
        : err?.message || 'Signature verification failed.'
      setError(msg)
      toast.error(msg)
      return false
    } finally {
      setVerifying(false)
    }
  }

  const clearError = () => setError(null)

  const value: WalletState = {
    walletAddress,
    shortAddress,
    walletName: wallet?.adapter.name || null,
    walletIcon: wallet?.adapter.icon || null,
    chain: 'solana',
    network,
    connected,
    connecting,
    disconnecting,
    error,
    balanceSol,
    balanceLoading,
    isVerified,
    verifying,
    isModalOpen,
    openWalletModal,
    closeWalletModal,
    connectWallet,
    disconnectWallet,
    signAndVerifyServer,
    refreshBalance,
    setError,
    clearError,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export const useWalletState = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletState must be used within a WalletContextProvider')
  }
  return context
}
