import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Bot,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  HelpCircle,
  Sliders,
  Terminal,
  Activity,
  CheckCircle,
  AlertTriangle,
  Send,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Wallet,
  Link,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StatCard } from '../../components/admin/StatCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { DataTable, Column } from '../../components/admin/DataTable'
import { ErrorState } from '../../components/admin/ErrorState'
import { ConnectWalletSidebar } from '../../components/ConnectWalletSidebar'

// ─── Interfaces ────────────────────────────────────────────────
interface BotStats {
  totalSol: number
  totalUsd: number
  sol24h: number
  usd24h: number
  totalCashoutCount: number
  isBotActive: boolean
  targetCashoutWallet: string
  minCashoutSol: number
  autoCashoutEnabled: boolean
  solPriceUsd: number
  totalProfitEstSol: number
  lastCashoutAt: string
}

interface CashOutRecord {
  id: string
  amountSol: number
  amountUsd: number
  recipientWallet: string
  status: string
  txHash?: string
  notes?: string
  executedBy?: string
  createdAt: string
}

interface BotSettings {
  isBotActive: boolean
  minCashoutSol: number
  targetCashoutWallet: string
  autoCashoutEnabled: boolean
  autoTradingEnabled: boolean
  slippageTolerance: number
  maxGasFeeSol: number
  profitTargetPct: number
  stopLossPct: number
  solPriceUsd: number
}

interface BotLogItem {
  id: string
  eventType: string
  title: string
  details?: string
  level: string
  createdAt: string
}

interface BotHelpData {
  overview: string
  botCommands: { command: string; description: string }[]
  faqs: { question: string; answer: string }[]
}

export const AdminBot: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const connectedAddress = publicKey?.toBase58() || ''

  const [activeTab, setActiveTab] = useState<'cashout' | 'help' | 'settings' | 'logs'>('cashout')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Wallet Sidebar state
  const [showWalletSidebar, setShowWalletSidebar] = useState(false)

  // Data states
  const [stats, setStats] = useState<BotStats | null>(null)
  const [cashouts, setCashouts] = useState<CashOutRecord[]>([])
  const [totalCashouts, setTotalCashouts] = useState(0)
  const [cashoutPage, setCashoutPage] = useState(1)
  const [cashoutPages, setCashoutPages] = useState(1)
  const [cashoutSearch, setCashoutSearch] = useState('')

  const [settings, setSettings] = useState<BotSettings>({
    isBotActive: true,
    minCashoutSol: 5.0,
    targetCashoutWallet: 'JUPbotAdminWallet111111111111111111111111',
    autoCashoutEnabled: true,
    autoTradingEnabled: true,
    slippageTolerance: 1.0,
    maxGasFeeSol: 0.01,
    profitTargetPct: 25.0,
    stopLossPct: 10.0,
    solPriceUsd: 150.0,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const [logs, setLogs] = useState<BotLogItem[]>([])
  const [logFilter, setLogFilter] = useState('all')

  const [helpData, setHelpData] = useState<BotHelpData | null>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Modal State
  const [showCashOutModal, setShowCashOutModal] = useState(false)
  const [cashOutAmount, setCashOutAmount] = useState('')
  const [cashOutRecipient, setCashOutRecipient] = useState('')
  const [cashOutNotes, setCashOutNotes] = useState('')
  const [processingCashOut, setProcessingCashOut] = useState(false)

  // ─── Fetch All Bot Data ──────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bot/stats', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load bot stats')
      const data = await res.json()
      setStats(data)
      if (data.targetCashoutWallet) {
        setCashOutRecipient(data.targetCashoutWallet)
      }
    } catch (err: any) {
      setError(err.message || 'Error loading bot stats')
    }
  }, [])

  const loadCashouts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(cashoutPage), limit: '10' })
      if (cashoutSearch) params.set('search', cashoutSearch)
      const res = await fetch(`/api/admin/bot/cashouts?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCashouts(data.items || [])
        setTotalCashouts(data.total || 0)
        setCashoutPages(data.pages || 1)
      }
    } catch {}
  }, [cashoutPage, cashoutSearch])

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bot/settings', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        if (data.targetCashoutWallet) {
          setCashOutRecipient(data.targetCashoutWallet)
        }
      }
    } catch {}
  }, [])

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bot/logs?type=${logFilter}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch {}
  }, [logFilter])

  const loadHelp = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bot/help', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setHelpData(data)
      }
    } catch {}
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    await Promise.all([loadStats(), loadCashouts(), loadSettings(), loadLogs(), loadHelp()])
    setLoading(false)
  }, [loadStats, loadCashouts, loadSettings, loadLogs, loadHelp])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    loadCashouts()
  }, [cashoutPage, cashoutSearch, loadCashouts])

  useEffect(() => {
    loadLogs()
  }, [logFilter, loadLogs])

  // ─── Actions ─────────────────────────────────────────────────
  const handleToggleBotStatus = async () => {
    try {
      const newStatus = !settings.isBotActive
      const updated = { ...settings, isBotActive: newStatus }
      setSettings(updated)
      const res = await fetch('/api/admin/bot/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBotActive: newStatus }),
      })
      if (res.ok) {
        toast.success(`Bot status updated to ${newStatus ? 'ACTIVE' : 'PAUSED'}`)
        loadStats()
      } else {
        toast.error('Failed to toggle bot status')
      }
    } catch {
      toast.error('Network error updating bot status')
    }
  }

  const handleSetConnectedAsTarget = async (addressToSet: string) => {
    if (!addressToSet) {
      toast.error('No wallet connected to set')
      return
    }
    try {
      const updated = { ...settings, targetCashoutWallet: addressToSet }
      setSettings(updated)
      setCashOutRecipient(addressToSet)

      const res = await fetch('/api/admin/bot/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCashoutWallet: addressToSet }),
      })

      if (res.ok) {
        toast.success(`Treasury wallet set to connected address (${addressToSet.slice(0, 6)}...${addressToSet.slice(-4)})!`)
        loadStats()
      } else {
        toast.error('Failed to save treasury wallet')
      }
    } catch {
      toast.error('Error updating treasury wallet')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/bot/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('Bot settings saved successfully!')
        loadStats()
      } else {
        toast.error('Failed to save bot settings')
      }
    } catch {
      toast.error('Error updating settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleExecuteCashOut = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(cashOutAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid SOL amount')
      return
    }

    setProcessingCashOut(true)
    try {
      const res = await fetch('/api/admin/bot/cashout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSol: amt,
          recipientWallet: cashOutRecipient || settings.targetCashoutWallet,
          notes: cashOutNotes || 'Manual bot cash out',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Successfully cashed out ${amt} SOL!`)
        setShowCashOutModal(false)
        setCashOutAmount('')
        setCashOutNotes('')
        loadAll()
      } else {
        toast.error(data.error || 'Cash out failed')
      }
    } catch {
      toast.error('Network error during cash out')
    } finally {
      setProcessingCashOut(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  // Cashout Table Columns
  const cashoutColumns: Column<CashOutRecord>[] = [
    {
      key: 'txHash',
      label: 'Transaction',
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#c7f284]/10 text-[#c7f284] flex items-center justify-center font-bold text-xs flex-shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="font-mono text-xs font-semibold text-white truncate max-w-[120px] sm:max-w-none">
              {c.txHash || c.id}
            </p>
            <p className="text-[10px] text-gray-500">{c.executedBy || 'System Bot'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount (SOL / USD)',
      render: (c) => (
        <div>
          <span className="font-bold text-xs text-[#c7f284]">
            +{c.amountSol.toLocaleString()} SOL
          </span>
          <span className="text-[10px] text-gray-400 block">
            ≈ ${(c.amountUsd || c.amountSol * (stats?.solPriceUsd || 150)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      key: 'recipient',
      label: 'Recipient Wallet',
      hideOnMobile: true,
      render: (c) => (
        <div className="flex items-center gap-1 text-[11px] font-mono text-gray-300">
          <span>{c.recipientWallet.slice(0, 6)}...{c.recipientWallet.slice(-6)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); copyToClipboard(c.recipientWallet, 'Wallet Address') }}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (c) => <StatusBadge status={c.status === 'completed' ? 'active' : 'pending'}>{c.status}</StatusBadge>,
    },
    {
      key: 'date',
      label: 'Timestamp',
      hideOnMobile: true,
      render: (c) => (
        <span className="text-[11px] text-gray-400">
          {new Date(c.createdAt).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ]

  if (error) return <ErrorState message={error} onRetry={loadAll} />

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0F16] border border-[#16212D] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#c7f284]/10 border border-[#c7f284]/30 flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-[#c7f284]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">Bot Operations & Cash Out</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                settings.isBotActive
                  ? 'bg-[#c7f284]/10 border-[#c7f284]/30 text-[#c7f284]'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {settings.isBotActive ? 'ACTIVE BOT' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Track total bot cash outs, connect your treasury wallet, execute profit sweeps, and configure rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBotStatus}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              settings.isBotActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-[#c7f284]/10 text-[#c7f284] border border-[#c7f284]/30 hover:bg-[#c7f284]/20'
            }`}
          >
            {settings.isBotActive ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Pause Bot
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" /> Start Bot
              </>
            )}
          </button>

          <button
            onClick={() => setShowCashOutModal(true)}
            className="px-4 py-2 bg-[#c7f284] text-[#06090E] rounded-xl text-xs font-bold hover:bg-[#b5e66f] transition-all flex items-center gap-1.5 shadow-lg shadow-[#c7f284]/10"
          >
            <Send className="w-3.5 h-3.5" /> Initiate Cash Out
          </button>

          <button
            onClick={loadAll}
            disabled={loading}
            className="p-2 rounded-xl bg-[#16212D] text-gray-400 hover:text-white border border-[#1F2E3D] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#c7f284]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Admin Treasury Wallet Setup Banner / Card ───────────── */}
      <div className="bg-[#0A0F16] border border-[#16212D] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#16212D] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              connected ? 'bg-[#c7f284]/10 text-[#c7f284] border border-[#c7f284]/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Admin Treasury Cash-Out Destination Wallet</h2>
                {connected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c7f284]/10 text-[#c7f284] border border-[#c7f284]/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c7f284] animate-pulse" /> Wallet Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Wallet Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Connect your Solana wallet (Phantom, Solflare, etc.) or set your target address so all bot earnings and cash outs go directly into your account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {connected ? (
              <button
                onClick={() => setShowWalletSidebar(true)}
                className="px-3.5 py-2 bg-[#16212D] hover:bg-[#1F2E3D] text-xs font-semibold text-gray-300 hover:text-white rounded-xl border border-[#1F2E3D] transition-colors flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5 text-[#c7f284]" /> Change Connected Wallet
              </button>
            ) : (
              <button
                onClick={() => setShowWalletSidebar(true)}
                className="px-4 py-2 bg-[#c7f284] hover:bg-[#b5e66f] text-[#06090E] font-bold text-xs rounded-xl shadow-lg shadow-[#c7f284]/10 transition-all flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" /> Connect Admin Wallet
              </button>
            )}
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Connected Wallet */}
          <div className="bg-[#06090E] border border-[#16212D] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-semibold">Your Connected Solana Wallet:</span>
              {connected && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {connectedAddress.slice(0, 4)}...{connectedAddress.slice(-4)}
                </span>
              )}
            </div>

            {connected ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="font-mono text-xs text-white truncate max-w-[240px] sm:max-w-none">
                  {connectedAddress}
                </p>
                {settings.targetCashoutWallet === connectedAddress ? (
                  <span className="px-2.5 py-1 bg-[#c7f284]/15 border border-[#c7f284]/30 text-[#c7f284] rounded-lg text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" /> SET AS TARGET
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetConnectedAsTarget(connectedAddress)}
                    className="px-3 py-1 bg-[#c7f284] text-[#06090E] hover:bg-[#b5e66f] rounded-lg text-[10px] font-extrabold flex-shrink-0 transition-all shadow"
                  >
                    Set as Target Treasury
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-amber-400/90 italic">
                  No Solana wallet connected to this browser session.
                </p>
                <button
                  onClick={() => setShowWalletSidebar(true)}
                  className="px-3 py-1 bg-[#16212D] hover:bg-[#1F2E3D] text-white text-[11px] font-semibold rounded-lg flex-shrink-0 transition-colors"
                >
                  Connect Now
                </button>
              </div>
            )}
          </div>

          {/* Box 2: Active Target Treasury Wallet */}
          <div className="bg-[#06090E] border border-[#16212D] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-semibold">Active Bot Treasury Destination:</span>
              <span className="text-[10px] text-[#c7f284] font-bold uppercase tracking-wide">Money Deposit Address</span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="font-mono text-xs text-[#c7f284] font-semibold truncate max-w-[260px] sm:max-w-none">
                {settings.targetCashoutWallet || 'Not configured'}
              </p>
              <button
                onClick={() => copyToClipboard(settings.targetCashoutWallet, 'Treasury Address')}
                className="p-1.5 bg-[#16212D] hover:bg-[#1F2E3D] text-gray-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
                title="Copy Treasury Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Top Metrics Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-[#c7f284]" />}
          title="Total Bot Cash Out"
          value={`${(stats?.totalSol || 0).toLocaleString()} SOL`}
          description={`≈ $${(stats?.totalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`}
          trend="+12.4% vs prev 30d"
        />
        <StatCard
          icon={<ArrowUpRight className="w-5 h-5 text-blue-400" />}
          title="24h Cash Out"
          value={`${(stats?.sol24h || 0).toLocaleString()} SOL`}
          description={`≈ $${(stats?.usd24h || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`}
          trend={`${stats?.totalCashoutCount || 0} total cashouts`}
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-purple-400" />}
          title="Est. Bot Net Profit"
          value={`${(stats?.totalProfitEstSol || 0).toLocaleString()} SOL`}
          description="Auto-harvested profits"
          trend="100% Operational"
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          title="Target Cash Out Wallet"
          value={stats?.targetCashoutWallet ? `${stats.targetCashoutWallet.slice(0, 4)}...${stats.targetCashoutWallet.slice(-4)}` : 'Configured'}
          description={`Min Threshold: ${stats?.minCashoutSol || 5} SOL`}
          trend={stats?.autoCashoutEnabled ? 'Auto Sweep ON' : 'Manual Sweeps Only'}
        />
      </div>

      {/* ─── Navigation Tabs ───────────────────────────────────── */}
      <div className="flex border-b border-[#16212D] space-x-1">
        <button
          onClick={() => setActiveTab('cashout')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'cashout'
              ? 'border-[#c7f284] text-[#c7f284] bg-[#c7f284]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Total Cash Out ({totalCashouts})
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'help'
              ? 'border-[#c7f284] text-[#c7f284] bg-[#c7f284]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Bot Help & FAQ
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-[#c7f284] text-[#c7f284] bg-[#c7f284]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Bot Settings
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-[#c7f284] text-[#c7f284] bg-[#c7f284]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> Bot Activity Logs ({logs.length})
        </button>
      </div>

      {/* ─── TAB 1: TOTAL CASH OUT ─────────────────────────────── */}
      {activeTab === 'cashout' && (
        <div className="space-y-4">
          <div className="bg-[#0A0F16] border border-[#16212D] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Treasury Destination Address</h3>
                <p className="font-mono text-xs text-[#c7f284] mt-0.5 flex items-center gap-2">
                  {settings.targetCashoutWallet}
                  <button
                    onClick={() => copyToClipboard(settings.targetCashoutWallet, 'Destination Wallet')}
                    className="text-gray-500 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-[#16212D] px-3 py-1.5 rounded-lg border border-[#1F2E3D]">
                <span className="text-gray-400">Auto Cash Out: </span>
                <span className={settings.autoCashoutEnabled ? 'text-[#c7f284] font-bold' : 'text-gray-400 font-bold'}>
                  {settings.autoCashoutEnabled ? 'ENABLED' : 'OFF'}
                </span>
              </div>
              <div className="bg-[#16212D] px-3 py-1.5 rounded-lg border border-[#1F2E3D]">
                <span className="text-gray-400">Trigger Threshold: </span>
                <span className="text-white font-bold">{settings.minCashoutSol} SOL</span>
              </div>
            </div>
          </div>

          <DataTable
            columns={cashoutColumns}
            data={cashouts}
            total={totalCashouts}
            page={cashoutPage}
            limit={10}
            pages={cashoutPages}
            onPageChange={setCashoutPage}
            onLimitChange={() => {}}
            searchValue={cashoutSearch}
            onSearchChange={(v) => { setCashoutSearch(v); setCashoutPage(1) }}
            searchPlaceholder="Search cash out by tx hash, wallet, or note..."
            loading={loading}
            emptyMessage="No bot cash outs recorded yet."
          />
        </div>
      )}

      {/* ─── TAB 2: BOT HELP ───────────────────────────────────── */}
      {activeTab === 'help' && (
        <div className="space-y-6">
          {/* Overview banner */}
          <div className="bg-gradient-to-r from-[#0B141F] to-[#0D1B2A] border border-[#16212D] rounded-2xl p-6 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="flex items-center gap-2 text-[#c7f284] text-xs font-bold uppercase tracking-wider mb-2">
                <HelpCircle className="w-4 h-4" /> Bot Documentation & Knowledge Base
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Understanding Bot Automation & Cash Out Mechanisms
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                {helpData?.overview || 'The Jupiter Wallet Bot monitors market liquidity, executes precision token trades, and automatically sweeps profit yields into your admin treasury wallet.'}
              </p>
            </div>
          </div>

          {/* Bot Commands */}
          <div className="bg-[#0A0F16] border border-[#16212D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#16212D] pb-3">
              <Terminal className="w-4 h-4 text-[#c7f284]" />
              <h3 className="text-sm font-bold text-white">Bot Command Reference</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {helpData?.botCommands.map((cmd, idx) => (
                <div key={idx} className="bg-[#06090E] border border-[#16212D] rounded-xl p-3 flex items-start gap-3">
                  <div className="px-2 py-1 bg-[#16212D] rounded font-mono text-xs text-[#c7f284] font-bold flex-shrink-0">
                    {cmd.command}
                  </div>
                  <p className="text-xs text-gray-300 leading-normal">{cmd.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="bg-[#0A0F16] border border-[#16212D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#16212D] pb-3">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-2">
              {helpData?.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx
                return (
                  <div key={idx} className="border border-[#16212D] rounded-xl overflow-hidden bg-[#06090E]">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left p-4 flex items-center justify-between text-xs font-semibold text-white hover:text-[#c7f284] transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-[#16212D] text-xs text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BOT SETTINGS ───────────────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-[#0A0F16] border border-[#16212D] rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#16212D] pb-4">
            <h2 className="text-base font-bold text-white">Bot Operational Configuration</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Customize automated trading rules, cash out thresholds, and target wallet routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Wallet */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">Target Cash Out Wallet Address</label>
                {connectedAddress && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, targetCashoutWallet: connectedAddress })}
                    className="text-[11px] font-semibold text-[#c7f284] hover:underline flex items-center gap-1"
                  >
                    Use Connected Wallet ({connectedAddress.slice(0, 4)}...{connectedAddress.slice(-4)})
                  </button>
                )}
              </div>
              <input
                type="text"
                value={settings.targetCashoutWallet}
                onChange={(e) => setSettings({ ...settings, targetCashoutWallet: e.target.value })}
                className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#c7f284]"
                placeholder="Enter Solana wallet address..."
              />
            </div>

            {/* Min Threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Min Auto Cash Out Threshold (SOL)</label>
              <input
                type="number"
                step="0.5"
                value={settings.minCashoutSol}
                onChange={(e) => setSettings({ ...settings, minCashoutSol: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c7f284]"
              />
            </div>

            {/* Slippage */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Slippage Tolerance (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.slippageTolerance}
                onChange={(e) => setSettings({ ...settings, slippageTolerance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c7f284]"
              />
            </div>

            {/* Max Gas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Max Priority Gas Fee (SOL)</label>
              <input
                type="number"
                step="0.005"
                value={settings.maxGasFeeSol}
                onChange={(e) => setSettings({ ...settings, maxGasFeeSol: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c7f284]"
              />
            </div>

            {/* Target Profit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Auto Profit Take Target (%)</label>
              <input
                type="number"
                step="1"
                value={settings.profitTargetPct}
                onChange={(e) => setSettings({ ...settings, profitTargetPct: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c7f284]"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-4 md:col-span-2 pt-2">
              <div className="flex items-center justify-between p-3 bg-[#06090E] border border-[#16212D] rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-white block">Auto Cash Out</span>
                  <span className="text-[10px] text-gray-400">Automatically transfer bot profits when min threshold is reached</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoCashoutEnabled}
                  onChange={(e) => setSettings({ ...settings, autoCashoutEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#c7f284] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#06090E] border border-[#16212D] rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-white block">Auto Trading & Liquidity Sniping</span>
                  <span className="text-[10px] text-gray-400">Enable algorithmic order execution and DEX pool scanning</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTradingEnabled}
                  onChange={(e) => setSettings({ ...settings, autoTradingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#c7f284] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#16212D]">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-[#c7f284] text-[#06090E] font-bold text-xs rounded-xl hover:bg-[#b5e66f] transition-all flex items-center gap-2"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Bot Settings
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 4: BOT LOGS ───────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Bot Event Log</h3>
            <div className="flex items-center gap-1 bg-[#0A0F16] p-1 border border-[#16212D] rounded-xl text-xs">
              {['all', 'cash_out', 'trade_sell', 'snipe', 'system_alert'].map((t) => (
                <button
                  key={t}
                  onClick={() => setLogFilter(t)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    logFilter === t ? 'bg-[#c7f284]/10 text-[#c7f284] font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0F16] border border-[#16212D] rounded-2xl divide-y divide-[#16212D] overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">No logs found for this filter.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-[#06090E] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    log.level === 'success' ? 'bg-[#c7f284]/10 text-[#c7f284]' :
                    log.level === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{log.title}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── CASH OUT MODAL ────────────────────────────────────── */}
      {showCashOutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0F16] border border-[#16212D] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#16212D] pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#c7f284]" />
                <h2 className="text-base font-bold text-white">Initiate Bot Cash Out</h2>
              </div>
              <button
                onClick={() => setShowCashOutModal(false)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleExecuteCashOut} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Amount to Cash Out (SOL)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 25.0"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                    className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7f284]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-[#c7f284]">SOL</span>
                </div>
                {cashOutAmount && !isNaN(parseFloat(cashOutAmount)) && (
                  <p className="text-[11px] text-gray-400">
                    ≈ ${(parseFloat(cashOutAmount) * (stats?.solPriceUsd || 150)).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Recipient Solana Wallet</label>
                  {connectedAddress && (
                    <button
                      type="button"
                      onClick={() => setCashOutRecipient(connectedAddress)}
                      className="text-[10px] text-[#c7f284] font-semibold hover:underline"
                    >
                      Use Connected ({connectedAddress.slice(0, 4)}...{connectedAddress.slice(-4)})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={cashOutRecipient}
                  onChange={(e) => setCashOutRecipient(e.target.value)}
                  className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#c7f284]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Notes / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly profit distribution"
                  value={cashOutNotes}
                  onChange={(e) => setCashOutNotes(e.target.value)}
                  className="w-full bg-[#06090E] border border-[#16212D] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c7f284]"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCashOutModal(false)}
                  className="flex-1 py-2.5 bg-[#16212D] text-gray-300 rounded-xl text-xs font-semibold hover:bg-[#1F2E3D] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingCashOut}
                  className="flex-1 py-2.5 bg-[#c7f284] text-[#06090E] rounded-xl text-xs font-bold hover:bg-[#b5e66f] transition-all flex items-center justify-center gap-1.5"
                >
                  {processingCashOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Confirm Cash Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONNECT WALLET SIDEBAR ─────────────────────────────── */}
      <ConnectWalletSidebar
        isOpen={showWalletSidebar}
        onClose={() => setShowWalletSidebar(false)}
      />
    </div>
  )
}
