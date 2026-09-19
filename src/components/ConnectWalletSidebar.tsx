import React, { useState, useEffect, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  X,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  LogOut,
  RefreshCw,
  QrCode,
  Smartphone,
  Check,
  Zap,
  Globe,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'

interface ConnectWalletSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export interface WalletItemConfig {
  name: string
  adapterName?: string
  icon: string
  subtitle?: string
  url?: string
  deepLink?: string
}

// Full wallet list matching Jupiter sidebar reference UI
const MASTER_WALLETS: WalletItemConfig[] = [
  {
    name: 'Social Login',
    subtitle: 'prev. ⚡ Quick Account',
    icon: 'https://www.google.com/favicon.ico',
  },
  {
    name: 'Solflare',
    adapterName: 'Solflare',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/images/solflare-icon.svg',
    url: 'https://solflare.com'
  },
  {
    name: 'Backpack',
    adapterName: 'Backpack',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/backpack/images/backpack-icon.svg',
    url: 'https://backpack.app'
  },
  {
    name: 'Coinbase Wallet',
    adapterName: 'Coinbase Wallet',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/coinbase/images/coinbase-icon.svg',
    url: 'https://www.coinbase.com/wallet'
  },
  {
    name: 'Magic Eden',
    icon: 'https://avatars.githubusercontent.com/u/108054095?s=200',
    url: 'https://magiceden.io'
  },
  {
    name: 'Jupiter',
    icon: 'https://station.jup.ag/favicon.ico',
    url: 'https://jup.ag'
  },
  {
    name: 'Trust',
    adapterName: 'Trust',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/trust/images/trust-icon.svg',
    url: 'https://trustwallet.com'
  },
  {
    name: 'Ledger',
    adapterName: 'Ledger',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/ledger/images/ledger-icon.svg',
    url: 'https://ledger.com'
  },
  {
    name: 'Trezor',
    adapterName: 'Trezor',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/trezor/images/trezor-icon.svg',
    url: 'https://trezor.io'
  },
  {
    name: 'Ethereum Wallet',
    icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
    url: 'https://metamask.io'
  },
  {
    name: 'Coin98',
    adapterName: 'Coin98',
    icon: 'https://coin98.com/favicon.ico',
    url: 'https://coin98.com'
  },
  {
    name: 'Google via TipLink',
    icon: 'https://www.google.com/favicon.ico',
    url: 'https://tiplink.io'
  },
  {
    name: 'Bitget Wallet',
    adapterName: 'Bitget Wallet',
    icon: 'https://www.bitget.com/favicon.ico',
    url: 'https://web3.bitget.com'
  },
  {
    name: 'QR',
    icon: 'https://cdn-icons-png.flaticon.com/512/3351/3351653.png',
  }
]

export const ConnectWalletSidebar: React.FC<ConnectWalletSidebarProps> = ({ isOpen, onClose }) => {
  const {
    walletAddress,
    shortAddress,
    walletName,
    walletIcon,
    connected,
    connecting,
    error,
    balanceSol,
    balanceLoading,
    isVerified,
    verifying,
    connectWallet,
    disconnectWallet,
    signAndVerifyServer,
    refreshBalance,
    clearError,
  } = useWalletState()

  const { wallets } = useWallet()

  const [mounted, setMounted] = useState(false)
  const [isWalletListExpanded, setIsWalletListExpanded] = useState(true)
  const [connectingItemName, setConnectingItemName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Sub-view mode ('main' | 'qr')
  const [subView, setSubView] = useState<'main' | 'qr'>('main')
  
  // QR session state
  const [qrSessionId, setQrSessionId] = useState<string>('')
  const [qrTimeLeft, setQrTimeLeft] = useState<number>(120)
  const [qrExpired, setQrExpired] = useState<boolean>(false)

  // Detect real installed wallet adapters from browser extension
  const installedAdapters = useMemo(() => {
    return wallets.filter(
      (w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
    )
  }, [wallets])

  // Mount animation handling
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const t = setTimeout(() => {
        setMounted(false)
        setSubView('main')
        setConnectingItemName(null)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // QR Code generator
  const generateQrSession = () => {
    const randomId = 'session_' + Math.random().toString(36).substring(2, 12)
    setQrSessionId(randomId)
    setQrTimeLeft(120)
    setQrExpired(false)
  }

  const openQrView = () => {
    generateQrSession()
    setSubView('qr')
  }

  // Countdown timer for QR code
  useEffect(() => {
    if (subView !== 'qr' || qrExpired || qrTimeLeft <= 0) return
    const timer = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          setQrExpired(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [subView, qrTimeLeft, qrExpired])

  const handleConnectWalletItem = async (item: WalletItemConfig) => {
    clearError()

    if (item.name === 'QR') {
      openQrView()
      return
    }

    setConnectingItemName(item.name)

    // Try to find matching adapter
    const adapter = wallets.find(
      (w) =>
        w.adapter.name.toLowerCase() === (item.adapterName || item.name).toLowerCase() ||
        (item.adapterName && w.adapter.name.toLowerCase().includes(item.adapterName.toLowerCase()))
    )

    if (adapter) {
      const isInstalled =
        adapter.readyState === WalletReadyState.Installed ||
        adapter.readyState === WalletReadyState.Loadable

      if (!isInstalled) {
        if (item.url) {
          window.open(item.url, '_blank')
          toast(`${item.name} extension not installed. Opening download link...`, { icon: '🌐' })
        } else {
          toast.error(`${item.name} extension not detected in your browser.`)
        }
        setConnectingItemName(null)
        return
      }

      try {
        await connectWallet(adapter.adapter.name)
        onClose()
      } catch (err) {
        // Error set in context
      } finally {
        setConnectingItemName(null)
      }
      return
    }

    // Special handlers
    if (item.name.includes('Jupiter')) {
      const phantomAdapter = wallets.find((w) => w.adapter.name.toLowerCase() === 'phantom')
      if (phantomAdapter && phantomAdapter.readyState === WalletReadyState.Installed) {
        handleConnectWalletItem({ name: 'Phantom', adapterName: 'Phantom', icon: item.icon })
        return
      }
    }

    if (item.url) {
      window.open(item.url, '_blank')
    }
    setConnectingItemName(null)
  }

  const handleCopyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    toast.success('Wallet address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted) return null

  const qrUri = `solana:${walletAddress || 'connect'}?session=${qrSessionId}&dapp=${encodeURIComponent(window.location.origin)}`

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog">
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`relative flex flex-col w-full sm:w-[420px] bg-[#070D16] border-l-0 sm:border-l border-[#182638] shadow-2xl
          h-[100dvh] sm:h-full
          rounded-t-3xl sm:rounded-none sm:rounded-l-3xl
          transition-transform duration-300 ease-out will-change-transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] z-10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 flex-shrink-0 border-b border-[#142030]/80">
          <div className="flex items-center gap-2.5">
            {subView === 'qr' && (
              <button
                onClick={() => setSubView('main')}
                className="w-7 h-7 rounded-full bg-[#0E1724] border border-[#1E2D40] flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Back to Wallets"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold text-white tracking-tight">
              {subView === 'qr' ? 'Scan QR Code' : 'Connect'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0E1724] border border-[#1E2D40] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#162436] transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          {/* CONNECTED STATE BOX */}
          {connected && walletAddress ? (
            <div className="bg-[#0B1522] border border-[#1D2E44] rounded-2xl p-4 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B7F34A]/10 text-[#B7F34A] border border-[#B7F34A]/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A] animate-pulse" /> Live Connected
                </span>
                <span className="text-xs text-gray-400 font-semibold">{walletName || 'Solana Wallet'}</span>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Wallet Address</p>
                <p className="font-mono text-xs text-[#B7F34A] font-bold truncate mt-0.5 select-all">{walletAddress}</p>
              </div>

              {/* RPC Balance */}
              <div className="bg-[#070D16] border border-[#162436] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Solana RPC Balance</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    {balanceLoading ? (
                      <span className="text-gray-400 animate-pulse">Loading...</span>
                    ) : balanceSol !== null ? (
                      `${balanceSol.toFixed(4)} SOL`
                    ) : (
                      '0.00 SOL'
                    )}
                  </p>
                </div>
                <button
                  onClick={refreshBalance}
                  className="p-1.5 text-gray-400 hover:text-white bg-[#0F1A28] rounded-lg transition-colors cursor-pointer"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? 'animate-spin text-[#B7F34A]' : ''}`} />
                </button>
              </div>

              {/* Signature Verification */}
              <div className="pt-2 border-t border-[#142030]">
                {isVerified ? (
                  <div className="bg-[#B7F34A]/10 border border-[#B7F34A]/30 rounded-xl p-2.5 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#B7F34A] flex-shrink-0" />
                    <p className="text-[11px] font-bold text-white">Server Signature Verified</p>
                  </div>
                ) : (
                  <button
                    onClick={signAndVerifyServer}
                    disabled={verifying}
                    className="w-full py-2 bg-[#00D2B8] hover:bg-[#00b8a2] text-[#060B11] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{verifying ? 'Signing Challenge...' : 'Verify Wallet Ownership'}</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleCopyAddress}
                  className="flex-1 py-2 bg-[#142030] hover:bg-[#1B2B3E] text-white text-xs font-semibold rounded-xl border border-[#22344A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#B7F34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Address'}</span>
                </button>

                <a
                  href={`https://solscan.io/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#142030] hover:bg-[#1B2B3E] text-gray-300 hover:text-white rounded-xl border border-[#22344A] transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={disconnectWallet}
                  className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* STATUS / ERROR BANNER */}
          {connecting && (
            <div className="bg-[#0C1726] border border-[#1F3248] rounded-2xl p-3.5 flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-[#B7F34A] animate-spin flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Connecting to {connectingItemName || 'Wallet'}...</p>
                <p className="text-[11px] text-gray-400">Approve the connection prompt in your wallet.</p>
              </div>
            </div>
          )}

          {error && !connecting && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-300">Connection Error</p>
                <p className="text-xs text-red-300/80 leading-normal mt-0.5">{error}</p>
              </div>
              <button onClick={clearError} className="text-red-400 text-xs font-bold hover:text-white">✕</button>
            </div>
          )}

          {/* SUB-VIEW: QR CODE SCANNER */}
          {subView === 'qr' && (
            <div className="bg-[#0B1522] border border-[#1D2E44] rounded-2xl p-5 space-y-4 flex flex-col items-center text-center animate-fadeIn">
              <div className="p-3 bg-white rounded-2xl border-4 border-[#00D2B8]/40 shadow-xl">
                {!qrExpired ? (
                  <QRCodeSVG value={qrUri} size={180} level="H" includeMargin={true} />
                ) : (
                  <div className="w-[180px] h-[180px] flex flex-col items-center justify-center bg-gray-900 rounded-xl text-white p-4 space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs font-bold">QR Session Expired</p>
                    <button
                      onClick={generateQrSession}
                      className="px-3 py-1 bg-[#B7F34A] text-[#060B11] text-[11px] font-bold rounded-lg hover:bg-[#a6e038] transition-colors cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </div>

              {!qrExpired && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-300">
                    Scan with Phantom or Solflare Mobile App
                  </p>
                  <p className="text-[11px] text-[#B7F34A] font-mono font-bold">
                    Expires in: {Math.floor(qrTimeLeft / 60)}:{('0' + (qrTimeLeft % 60)).slice(-2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MAIN WALLET LIST VIEW */}
          {subView === 'main' && (
            <>
              {/* ─── RECOMMENDED SECTION ───────────────────────────── */}
              <div className="space-y-3">
                {/* Card 1: Jupiter Extension (Recommended) */}
                <button
                  onClick={() => handleConnectWalletItem({ name: 'Phantom', adapterName: 'Phantom', icon: 'https://station.jup.ag/favicon.ico' })}
                  disabled={connecting}
                  className="w-full text-left relative bg-[#0C1520] hover:bg-[#111C2B] border border-[#1E3024] hover:border-[#27442B] rounded-2xl p-4 transition-all active:scale-[0.99] group cursor-pointer shadow-lg disabled:opacity-60"
                >
                  <span className="absolute top-3 right-3 bg-[#182B1B] text-[#9EE838] border border-[#27442B] text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-tight">
                    Recommended
                  </span>
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#09111A] border border-[#1E3024] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <svg className="w-6 h-6 text-[#00D2B8]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 16.5c-2.32-.42-4.14-2.19-4.63-4.5h2.15c.42 1.25 1.45 2.18 2.48 2.48v2.02zm0-11c-1.03.3-2.06 1.23-2.48 2.48H5.57c.49-2.31 2.31-4.08 4.63-4.5v2.02zm3.6 11v-2.02c1.03-.3 2.06-1.23 2.48-2.48h2.15c-.49 2.31-2.31 4.08-4.63 4.5zm0-11V5.48c2.32.42 4.14 2.19 4.63 4.5h-2.15c-.42-1.25-1.45-2.18-2.48-2.48z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#B7F34A] transition-colors leading-tight">
                        Jupiter Extension
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Instant trades with auto-approvals!</p>
                    </div>
                  </div>
                </button>

                {/* Card 2: Jupiter Mobile */}
                <button
                  onClick={openQrView}
                  className="w-full text-left bg-[#0C1520] hover:bg-[#111C2B] border border-[#162232] hover:border-[#22354E] rounded-2xl p-4 transition-all active:scale-[0.99] group cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#09111A] border border-[#1A283A] flex items-center justify-center flex-shrink-0 text-[#B7F34A]">
                      <QrCode className="w-5 h-5 text-[#00D2B8]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors leading-tight">
                        Jupiter Mobile
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Scan QR code to connect</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* ─── INSTALLED SECTION ─────────────────────────────── */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-gray-300">Installed</h3>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {/* Metamask / Fox */}
                  <button
                    onClick={() => handleConnectWalletItem({ name: 'Ethereum Wallet', icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg' })}
                    disabled={connecting}
                    className="w-[68px] h-[68px] sm:w-[64px] sm:h-[64px] rounded-2xl bg-[#0D1623] border border-[#1A283A] hover:border-[#2C415C] hover:bg-[#131F30] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Ethereum Wallet / MetaMask"
                  >
                    <img src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" alt="MetaMask" className="w-8 h-8 object-contain" />
                  </button>

                  {/* Brave Lion / Solflare */}
                  <button
                    onClick={() => handleConnectWalletItem({ name: 'Solflare', adapterName: 'Solflare', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/images/solflare-icon.svg' })}
                    disabled={connecting}
                    className="w-[68px] h-[68px] sm:w-[64px] sm:h-[64px] rounded-2xl bg-[#0D1623] border border-[#1A283A] hover:border-[#2C415C] hover:bg-[#131F30] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Brave Wallet / Solflare"
                  >
                    <img src="https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/images/solflare-icon.svg" alt="Solflare" className="w-7 h-7 object-contain" />
                  </button>

                  {/* Backpack */}
                  <button
                    onClick={() => handleConnectWalletItem({ name: 'Backpack', adapterName: 'Backpack', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/backpack/images/backpack-icon.svg' })}
                    disabled={connecting}
                    className="w-[68px] h-[68px] sm:w-[64px] sm:h-[64px] rounded-2xl bg-[#0D1623] border border-[#1A283A] hover:border-[#2C415C] hover:bg-[#131F30] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Backpack"
                  >
                    <img src="https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/backpack/images/backpack-icon.svg" alt="Backpack" className="w-7 h-7 object-contain" />
                  </button>

                  {/* Phantom / Ghost */}
                  <button
                    onClick={() => handleConnectWalletItem({ name: 'Phantom', adapterName: 'Phantom', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/images/phantom-icon.svg' })}
                    disabled={connecting}
                    className="w-[68px] h-[68px] sm:w-[64px] sm:h-[64px] rounded-2xl bg-[#0D1623] border border-[#1A283A] hover:border-[#2C415C] hover:bg-[#131F30] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Phantom"
                  >
                    <img src="https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/images/phantom-icon.svg" alt="Phantom" className="w-7 h-7 object-contain" />
                  </button>
                </div>
              </div>

              {/* ─── TOGGLE BUTTON DIVIDER ─────────────────────────── */}
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[1px] bg-[#172536]" />
                </div>
                <button
                  onClick={() => setIsWalletListExpanded((v) => !v)}
                  className="relative bg-[#0B131E] border border-[#1E2D40] hover:border-[#2C415C] text-xs font-semibold text-[#8DA0B8] hover:text-white px-3.5 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors shadow-sm z-10 active:scale-95"
                >
                  {isWalletListExpanded ? (
                    <>
                      <span>View Less Wallets</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>View More Wallets</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* ─── GRID LIST OF WALLETS ───────────────────────────── */}
              {isWalletListExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fadeIn">
                  {MASTER_WALLETS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleConnectWalletItem(item)}
                      disabled={connecting}
                      className="w-full bg-[#0D1623] border border-[#192738] hover:border-[#283C54] hover:bg-[#121E2E] rounded-2xl px-4 py-3 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 text-left"
                    >
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-6 h-6 rounded-md object-contain flex-shrink-0"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src =
                            'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/images/phantom-icon.svg'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white leading-tight truncate">{item.name}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">{item.subtitle}</p>
                        )}
                      </div>
                      {connectingItemName === item.name && (
                        <RefreshCw className="w-4 h-4 text-[#B7F34A] animate-spin flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
