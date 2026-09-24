import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'
import toast from 'react-hot-toast'
import { walletApi } from '../lib/walletApi'
import { isMetaMaskBrowserAvailable, prepareMetaMaskSolana } from '../lib/metamaskSolana'
import { getBrowserSessionId } from '../lib/browserSession'
import {
  formatWalletConnectError,
  findWalletByHint,
  getWalletAdapterName,
  isWalletConnectable,
  waitForWalletByHint,
  openWalletExtension,
  isWalletUserCancel,
  isWalletNotReadyYet,
} from '../lib/walletConnectHelpers'
import {
  clearPendingMobileWallet,
  getPendingMobileWallet,
  isMetaMaskInAppBrowser,
  isMobileDevice,
  isPhantomInAppBrowser,
  markPendingMobileWallet,
  openCurrentPageInMetaMask,
  openCurrentPageInPhantom,
  stripConnectQuery,
  walletHintIsMetaMask,
  walletHintIsPhantom,
  walletRequestedInUrl,
} from '../lib/mobileWallet'
import { rememberRecentWallet } from '../lib/detectInstalledWallets'
import { clearSecurityCheckSession } from '../lib/metaMaskSecurityCheck'

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

  const walletsRef = useRef(wallets)
  walletsRef.current = wallets
  const resumeAttempted = useRef(false)

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

  // Sync connection state with local + server logging
  useEffect(() => {
    if (connected && publicKey) {
      const name =
        getWalletAdapterName(wallet ? { adapter: wallet.adapter, readyState: wallet.adapter.readyState } : undefined) ||
        'Solana Wallet'
      const address = publicKey.toBase58()
      setError(null)
      void refreshBalance()

      void walletApi
        .recordConnect({
          walletAddress: address,
          walletType: name,
          chain: 'solana',
          network,
          balanceSol,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          browserSessionId: getBrowserSessionId(),
        })
        .catch(() => {
          /* admin log must not break a live wallet session */
        })

      setIsModalOpen(false)
    } else if (!connected) {
      setBalanceSol(null)
      setIsVerified(false)
    }
  }, [connected, publicKey, wallet, network, refreshBalance, balanceSol])

  // Live presence for admin (heartbeat while connected)
  useEffect(() => {
    if (!connected || !publicKey) return
    const name =
      getWalletAdapterName(wallet ? { adapter: wallet.adapter, readyState: wallet.adapter.readyState } : undefined) ||
      'Solana Wallet'

    const sendPresence = () => {
      walletApi.recordPresence({
        walletAddress: publicKey.toBase58(),
        walletType: name,
        network,
        balanceSol: balanceSol,
        pageUrl: window.location.href,
        browserSessionId: getBrowserSessionId(),
      })
    }

    sendPresence()
    const id = window.setInterval(sendPresence, 15_000)
    return () => window.clearInterval(id)
  }, [connected, publicKey, wallet, network, balanceSol])

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

  const openWalletModal = () => {
    if (connected) return
    setIsModalOpen(true)
  }
  const closeWalletModal = () => setIsModalOpen(false)

  useEffect(() => {
    const returnToApp = () => {
      if (!connected) return
      setIsModalOpen(false)
      try {
        window.focus()
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('focus', returnToApp)
    document.addEventListener('visibilitychange', returnToApp)
    return () => {
      window.removeEventListener('focus', returnToApp)
      document.removeEventListener('visibilitychange', returnToApp)
    }
  }, [connected])

  // Connect specific wallet by adapter name
  const connectWallet = async (adapterName?: string) => {
    setError(null)
    try {
      if (!adapterName) {
        throw new Error('Choose a wallet from the list to connect.')
      }

      const hint = adapterName
      const mobile = isMobileDevice()

      if (walletHintIsMetaMask(hint)) {
        const inMetaMask = isMetaMaskInAppBrowser() || isMetaMaskBrowserAvailable()
        if (mobile && !inMetaMask) {
          markPendingMobileWallet('MetaMask')
          toast('Opening this page inside MetaMask…')
          openCurrentPageInMetaMask()
          return
        }
        await prepareMetaMaskSolana()
      }

      if (walletHintIsPhantom(hint) && mobile && !isPhantomInAppBrowser()) {
        const phantomReady = findWalletByHint(walletsRef.current, hint)
        if (!phantomReady || !isWalletConnectable(phantomReady)) {
          markPendingMobileWallet('Phantom')
          toast('Opening this page inside Phantom…')
          openCurrentPageInPhantom()
          return
        }
      }

      const target = await waitForWalletByHint(() => walletsRef.current, hint, mobile ? 8000 : 6000)

      if (!target) {
        if (walletHintIsMetaMask(hint) && mobile && !isMetaMaskInAppBrowser() && !isMetaMaskBrowserAvailable()) {
          markPendingMobileWallet('MetaMask')
          toast('Opening this page inside MetaMask…')
          openCurrentPageInMetaMask()
          return
        }
        const sample = walletsRef.current.map((w) => getWalletAdapterName(w)).filter(Boolean).join(', ')
        throw new Error(
          walletHintIsMetaMask(hint)
            ? 'MetaMask did not expose a Solana account. In MetaMask, enable Solana (Settings), then tap Connect again and approve.'
            : `Could not find ${adapterName} in this browser.${sample ? ` Detected: ${sample}.` : ''} Install the extension or pick another wallet.`
        )
      }

      const name = getWalletAdapterName(target)
      toast('Approve the connection in your wallet…', { duration: 8000 })
      await openWalletExtension({
        adapter: target.adapter,
        select,
        connectSelected: connect,
      })

      let address = ''
      const waitRounds = mobile ? 80 : 60
      for (let i = 0; i < waitRounds && !address; i++) {
        const connectedAdapter = walletsRef.current.find((w) => w.adapter.connected)?.adapter
        address =
          connectedAdapter?.publicKey?.toBase58?.() ||
          walletsRef.current.find((w) => getWalletAdapterName(w) === name)?.adapter.publicKey?.toBase58?.() ||
          publicKey?.toBase58?.() ||
          ''
        if (!address) await new Promise((r) => setTimeout(r, 150))
      }

      if (!address) {
        throw new Error(
          'Wallet did not return an address. Approve the connection in your wallet, then tap Connect again.'
        )
      }

      void walletApi
        .recordConnect({
          walletAddress: address,
          walletType: name || hint,
          chain: 'solana',
          network,
          pageUrl: window.location.href,
          browserSessionId: getBrowserSessionId(),
        })
        .catch(() => {
          /* admin log must not break a live wallet session */
        })
      rememberRecentWallet(name || hint)
      clearPendingMobileWallet()
      stripConnectQuery()

      const label = `${address.slice(0, 4)}...${address.slice(-4)}`
      toast.success(
        () => (
          <div className="text-sm">
            <p className="font-bold text-white">Wallet Connected</p>
            <p className="text-gray-300 text-xs mt-0.5">Connected to wallet {label}</p>
          </div>
        ),
        { duration: 4000 }
      )
      setIsModalOpen(false)
      clearSecurityCheckSession()
      try {
        window.focus()
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      const msg = formatWalletConnectError(err)
      setError(msg)
      if (isWalletUserCancel(err)) {
        toast.error(msg)
      } else if (isWalletNotReadyYet(err)) {
        toast('Approve the connection in your wallet popup when it appears.', { icon: 'ℹ️' })
      } else {
        toast.error(msg)
      }
      throw err
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || resumeAttempted.current || connected) return
    const pending = walletRequestedInUrl() || getPendingMobileWallet()
    if (!pending) return
    if (walletHintIsMetaMask(pending) && !isMetaMaskInAppBrowser() && !isMetaMaskBrowserAvailable()) return
    if (walletHintIsPhantom(pending) && !isPhantomInAppBrowser()) return
    resumeAttempted.current = true
    const timer = window.setTimeout(() => {
      void connectWallet(pending).catch(() => {
        resumeAttempted.current = false
      })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [wallets, connected])

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
    walletName:
      getWalletAdapterName(wallet ? { adapter: wallet.adapter, readyState: wallet.adapter.readyState } : undefined) ||
      null,
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
