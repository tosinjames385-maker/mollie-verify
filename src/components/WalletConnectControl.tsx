import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWalletState } from '../context/WalletContext'

type WalletConnectControlProps = {
  /** Token page: green-outline button; default: compact pill in header rows */
  variant?: 'hero' | 'compact'
  className?: string
}

export function WalletConnectControl({ variant = 'compact', className = '' }: WalletConnectControlProps) {
  const { publicKey, wallet } = useWallet()
  const {
    connected,
    connecting,
    shortAddress,
    balanceSol,
    openWalletModal,
    disconnectWallet,
  } = useWalletState()
  const [menuOpen, setMenuOpen] = useState(false)

  const isConnected = connected && publicKey

  if (connecting) {
    if (variant === 'hero') {
      return (
        <button
          type="button"
          disabled
          className={`flex-1 md:flex-initial md:w-[140px] px-4 py-2 md:py-1.5 bg-[#091018] border border-[#B7F34A]/40 text-[#B7F34A] rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-wait opacity-90 ${className}`}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting
        </button>
      )
    }
    return (
      <button
        type="button"
        disabled
        className={`bg-[#1a2332] border border-[#2a3544] text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 cursor-wait ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c7f284]" />
        Connecting
      </button>
    )
  }

  if (isConnected) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={
            variant === 'hero'
              ? 'flex-1 md:flex-initial min-w-[140px] px-4 py-2 md:py-1.5 bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all'
              : 'bg-[#0D1520] hover:bg-[#152232] border border-[#1E2D40] text-white px-3 py-1.5 rounded-full flex items-center gap-2 transition-all'
          }
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c7f284] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c7f284]" />
          </span>
          <span className="font-mono text-xs font-bold">{shortAddress}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="absolute right-0 mt-2 w-64 bg-[#0F1722] border border-[#1C2A3A] rounded-2xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-3 py-2 border-b border-[#1C2A3A]">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Connected Wallet</p>
                <p className="font-mono text-xs text-[#c7f284] font-bold truncate mt-0.5">{publicKey.toBase58()}</p>
                <p className="text-[10px] text-gray-500 capitalize mt-0.5">{wallet?.adapter.name || 'Solana Wallet'}</p>
                {balanceSol !== null && (
                  <p className="text-[11px] text-white mt-1">{balanceSol.toFixed(4)} SOL</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicKey.toBase58())
                  toast.success('Wallet address copied!')
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-[#1A2636] rounded-xl flex items-center gap-2"
              >
                <Copy className="w-4 h-4 text-gray-400" />
                Copy Address
              </button>
              <a
                href={`https://solscan.io/account/${publicKey.toBase58()}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-[#1A2636] rounded-xl flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                View on Explorer
              </a>
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false)
                  await disconnectWallet()
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={openWalletModal}
        className={`flex-1 md:flex-initial md:w-[140px] px-4 py-2 md:py-1.5 bg-[#091018] border border-[#B7F34A]/60 text-[#B7F34A] hover:bg-[#B7F34A]/10 rounded-lg font-bold text-sm transition-colors text-center ${className}`}
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openWalletModal}
      className={`bg-[#c7f284] hover:bg-[#b5e66f] text-[#06090E] font-extrabold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${className}`}
    >
      <Wallet className="w-3.5 h-3.5" />
      Connect Wallet
    </button>
  )
}
