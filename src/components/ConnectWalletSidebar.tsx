import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface ConnectWalletSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// ───────── Wallet data ─────────
// Structured array so wallets can be added/removed easily.
// `installed` marks wallets shown in the horizontal Installed row.
// Keep icon URLs as 20-24px ready assets. Fallback handled via onError.
type WalletItem = {
  name: string
  icon: string
  secondary?: string
  installed?: boolean
  // adapterName matches Solana wallet adapter name for real connect
  adapterName?: string
}

const walletsData: WalletItem[] = [
  {
    name: 'Social Login',
    icon: 'https://www.google.com/favicon.ico',
    secondary: 'prev. Quick Account',
    adapterName: undefined,
  },
  { name: 'Phantom', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/images/phantom-icon.svg', installed: true, adapterName: 'Phantom' },
  { name: 'Solflare', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/images/solflare-icon.svg', installed: true, adapterName: 'Solflare' },
  // Fallback for Brave/MetaMask-like installed example – maps to Backpack for demo if needed
  { name: 'Brave Wallet', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/backpack/images/backpack-icon.svg', installed: true, adapterName: 'Backpack' },
  { name: 'Backpack', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/backpack/images/backpack-icon.svg', adapterName: 'Backpack' },
  { name: 'Coinbase Wallet', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/coinbase/images/coinbase-icon.svg', adapterName: 'Coinbase' },
  { name: 'Magic Eden', icon: 'https://avatars.githubusercontent.com/u/108054095?s=200', adapterName: undefined },
  { name: 'Jupiter', icon: 'https://station.jup.ag/favicon.ico', adapterName: undefined },
  { name: 'Trust', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/trust/images/trust-icon.svg', adapterName: 'Trust' },
  { name: 'Ledger', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/ledger/images/ledger-icon.svg', adapterName: 'Ledger' },
  { name: 'Trezor', icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/trezor/images/trezor-icon.svg', adapterName: 'Trezor' },
  { name: 'Ethereum Wallet', icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg', adapterName: undefined },
  { name: 'Coin98', icon: 'https://coin98.com/favicon.ico', adapterName: undefined },
  { name: 'Google via TipLink', icon: 'https://www.google.com/favicon.ico', adapterName: undefined },
  { name: 'Bitget Wallet', icon: 'https://www.bitget.com/favicon.ico', adapterName: undefined },
  { name: 'QR', icon: 'https://cdn-icons-png.flaticon.com/512/3351/3351653.png', adapterName: undefined },
]

const installedWallets = walletsData.filter(w => w.installed).slice(0, 3)
const expandedWallets = walletsData

// ───────── Reusable subcomponents ─────────
const RecommendedWalletCard = ({
  onClick,
  isConnecting,
}: {
  onClick: () => void
  isConnecting: boolean
}) => (
  <button
    onClick={onClick}
    disabled={isConnecting}
    className="w-full text-left relative bg-[#111A25] border border-[#1D2936] hover:border-[#24344A] rounded-xl p-3.5 flex items-center gap-3.5 transition-colors active:scale-[0.99] disabled:opacity-60"
  >
    <span className="absolute -top-2 right-3 bg-[#1A2E1A] text-[#B7F34A] text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border border-[#234026]">
      Recommended
    </span>
    <div className="w-10 h-10 rounded-lg bg-[#0D141E] border border-[#1D2936] flex items-center justify-center flex-shrink-0 overflow-hidden">
      {/* Jupiter icon – simple SVG matching branding */}
      <svg className="w-6 h-6 text-[#22C8B8]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 16.5c-2.32-.42-4.14-2.19-4.63-4.5h2.15c.42 1.25 1.45 2.18 2.48 2.48v2.02zm0-11c-1.03.3-2.06 1.23-2.48 2.48H5.57c.49-2.31 2.31-4.08 4.63-4.5v2.02zm3.6 11v-2.02c1.03-.3 2.06-1.23 2.48-2.48h2.15c-.49 2.31-2.31 4.08-4.63 4.5zm0-11V5.48c2.32.42 4.14 2.19 4.63 4.5h-2.15c-.42-1.25-1.45-2.18-2.48-2.48z" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[14px] font-semibold text-white leading-none">Jupiter Mobile App</div>
      <div className="text-[11px] text-[#64748B] font-medium mt-1 leading-none">Instant trades with auto-approvals!</div>
    </div>
    {isConnecting && <span className="w-4 h-4 border-2 border-[#1D2936] border-t-[#B7F34A] rounded-full animate-spin flex-shrink-0" />}
  </button>
)

const InstalledWallets = ({
  onSelect,
  selectedWallet,
  isConnecting,
}: {
  onSelect: (name: string) => void
  selectedWallet: string | null
  isConnecting: boolean
}) => (
  <div>
    <div className="text-[12px] font-semibold text-white mb-2.5">Installed</div>
    <div className="flex items-center gap-2.5">
      {installedWallets.map((w) => (
        <button
          key={w.name}
          onClick={() => onSelect(w.name)}
          disabled={isConnecting}
          className={`w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] bg-[#0D141E] border rounded-[10px] flex items-center justify-center transition-colors active:scale-[0.97] disabled:opacity-60 ${
            selectedWallet === w.name && isConnecting ? 'border-[#B7F34A]/60 bg-[#111A25]' : 'border-[#1D2936] hover:border-[#24344A] hover:bg-[#111A25]'
          }`}
          aria-label={`Connect ${w.name}`}
        >
          <img
            src={w.icon}
            alt={w.name}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </button>
      ))}
    </div>
  </div>
)

const WalletListItem = ({
  wallet,
  onClick,
  isConnecting,
  isSelected,
}: {
  wallet: WalletItem
  onClick: () => void
  isConnecting: boolean
  isSelected: boolean
}) => (
  <button
    onClick={onClick}
    disabled={isConnecting}
    className={`w-full flex items-center gap-3 px-3 transition-colors text-left h-[46px] rounded-[8px] border active:scale-[0.99] disabled:opacity-60 ${
      isSelected && isConnecting
        ? 'bg-[#152030] border-[#24344A]'
        : 'bg-[#0D141E] border-[#1D2936] hover:bg-[#111A25] hover:border-[#24344A]'
    }`}
  >
    <img
      src={wallet.icon}
      alt={wallet.name}
      className="w-[22px] h-[22px] rounded-full object-contain flex-shrink-0 bg-white/0"
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-medium text-white leading-none truncate">{wallet.name}</div>
      {wallet.secondary && <div className="text-[11px] text-[#64748B] leading-none mt-1 truncate">{wallet.secondary}</div>}
    </div>
    {isSelected && isConnecting ? (
      <span className="w-4 h-4 border-2 border-[#1D2936] border-t-white rounded-full animate-spin flex-shrink-0" />
    ) : null}
  </button>
)

// ───────── Main Panel ─────────
export const ConnectWalletSidebar = ({ isOpen, onClose }: ConnectWalletSidebarProps) => {
  const { wallets, select, connect, connected, wallet } = useWallet()

  const [mounted, setMounted] = useState(false)
  // State management as per spec
  const [isWalletListExpanded, setIsWalletListExpanded] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const connectedWallet = wallet?.adapter.name ?? null

  // Mount animation handling – keep in DOM for exit animation
  useEffect(() => {
    if (isOpen) setMounted(true)
    else {
      const t = setTimeout(() => {
        setMounted(false)
        setIsWalletListExpanded(false)
        setSelectedWallet(null)
        setConnectionError(null)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Lock background scroll + prevent underlying interaction
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleSelectWallet = async (walletName: string) => {
    setSelectedWallet(walletName)
    setConnectionError(null)

    // Find adapter for real Solana wallets
    const target = wallets.find((w) => w.adapter.name.toLowerCase() === walletName.toLowerCase() || (walletsData.find((d) => d.name === walletName)?.adapterName?.toLowerCase() === w.adapter.name.toLowerCase()))

    // If wallet requires real adapter and exists, attempt connect
    if (target) {
      try {
        setIsConnecting(true)
        // select first if not already selected
        if (wallet?.adapter.name !== target.adapter.name) {
          select(target.adapter.name)
          // small delay to let adapter switch
          await new Promise((r) => setTimeout(r, 50))
        }
        await connect()
        toast.success(`Connected to ${walletName}`)
        onClose()
      } catch (err: any) {
        const msg = err?.message || 'Connection rejected'
        setConnectionError(msg)
        toast.error(msg)
      } finally {
        setIsConnecting(false)
      }
      return
    }

    // Check if wallet is in our structured list but not yet integrated
    const meta = walletsData.find((w) => w.name === walletName)
    if (meta && !meta.adapterName) {
      // Structure ready to add later – show graceful message keep panel open
      setIsConnecting(true)
      setTimeout(() => {
        setIsConnecting(false)
        setConnectionError(`${walletName} not yet integrated – easily added to walletsData[]`)
        toast(`${walletName} coming soon`, { icon: '🟡' })
      }, 400)
      return
    }

    // For adapters that exist but wallet not found (e.g., Jupiter Mobile custom)
    if (walletName === 'Jupiter Mobile App') {
      // Try Phantom as fallback or just show connecting flow
      setIsConnecting(true)
      setTimeout(() => {
        setIsConnecting(false)
        toast('Jupiter Mobile App flow – connect via deep link (integration ready)', { icon: '🪐' })
      }, 500)
      return
    }

    setConnectionError(`${walletName} not supported yet`)
    toast.error(`${walletName} not supported yet`)
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog">
      {/* Overlay – semi-transparent dark, fades, click to close */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel – slides from RIGHT, dark background, near-full mobile height, rounded corners */}
      <div
        className={`relative flex flex-col w-full sm:w-[380px] sm:max-w-[420px] bg-[#070B13] sm:bg-[#0A121A] border-l-0 sm:border-l border-t sm:border-t-0 border-[#1D2936] shadow-2xl
          h-[100dvh] sm:h-full sm:h-[100dvh]
          rounded-t-[16px] sm:rounded-none sm:rounded-l-[16px]
          transition-transform duration-300 ease-out will-change-transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
        style={{ maxHeight: '100dvh' }}
      >
        {/* Header – stays at top, Close X circular */}
        <div className="flex items-center justify-between px-4 sm:px-5 h-[56px] flex-shrink-0 border-b border-[#1D2936]/60">
          <h2 className="text-[18px] font-bold text-white tracking-tight">Connect</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#111A25] border border-[#1D2936] flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#152030] hover:border-[#24344A] active:scale-95 transition-all"
            aria-label="Close wallet panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content – header stays, list scrolls */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-5 pb-6">
          {/* Recommended Wallet Card */}
          <RecommendedWalletCard onClick={() => handleSelectWallet('Jupiter Mobile App')} isConnecting={isConnecting && selectedWallet === 'Jupiter Mobile App'} />

          {/* Installed Wallets */}
          <InstalledWallets onSelect={handleSelectWallet} selectedWallet={selectedWallet} isConnecting={isConnecting} />

          {/* Connection status */}
          {connected && connectedWallet && (
            <div className="text-[11px] text-[#22C55E] bg-[#0F1F15] border border-[#1E3A1E] rounded-lg px-3 py-2">Connected: {connectedWallet}</div>
          )}
          {connectionError && (
            <div className="text-[11px] text-[#F87171] bg-[#1A0F0F] border border-[#3A1E1E] rounded-lg px-3 py-2">{connectionError}</div>
          )}

          {/* View More / View Less – centered expandable control with smooth animation */}
          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-[#1D2936]" />
            </div>
            <button
              onClick={() => setIsWalletListExpanded((v) => !v)}
              className="relative bg-[#070B13] sm:bg-[#0A121A] border border-[#1D2936] hover:border-[#24344A] hover:bg-[#0D141E] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[12px] font-semibold text-[#94A3B8] hover:text-white transition-colors z-10 active:scale-95"
            >
              {isWalletListExpanded ? (
                <>
                  View Less Wallets <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  View More Wallets <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Expanded Wallet List – vertical list of dark rounded rectangles */}
          <div
            className={`grid transition-all duration-300 ease-out ${isWalletListExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="space-y-2 pt-1">
                {expandedWallets.map((w) => (
                  <WalletListItem
                    key={w.name}
                    wallet={w}
                    onClick={() => handleSelectWallet(w.name)}
                    isConnecting={isConnecting}
                    isSelected={selectedWallet === w.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Optional bottom safe area spacer for mobile home indicator */}
        <div className="h-[env(safe-area-inset-bottom)] sm:h-0 flex-shrink-0" />
      </div>
    </div>
  )
}
