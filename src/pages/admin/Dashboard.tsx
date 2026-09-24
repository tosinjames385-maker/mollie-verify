import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users, AtSign, ArrowUpDown, Shield, Heart,
  Clock, CheckCircle, XCircle, Newspaper, Bot
} from 'lucide-react'
import { StatCard } from '../../components/admin/StatCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { EmptyState } from '../../components/admin/EmptyState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import {
  DEMO_ADMIN_STATS,
  DEMO_ADMIN_ACTIVITY,
  DEMO_ADMIN_HEALTH,
  DEMO_ADMIN_CHARTS,
  adminFetchJson,
} from '../../lib/adminDemo'
import { loadPayoutConfig, savePayoutConfig } from '../../lib/payoutWallet'

interface DashboardStats {
  users: { total: number; trend: string; last30d: number }
  xAccounts: { total: number; trend: string; last30d: number }
  wallets: { total: number; trend: string; last30d: number }
  tokens: { total: number; verified: number }
  submissions: { total: number; pending: number; approved: number; rejected: number; last30d: number }
  news: { total: number; pending: number }
  likes: number
}

interface Activity {
  id: string
  type: string
  description: string
  user: string
  timestamp: string
}

interface ChartData {
  labels: string[]
  users: number[]
  submissions: number[]
  likes: number[]
}

interface HealthService {
  name: string
  status: string
}

const activityIcons: Record<string, React.ReactNode> = {
  user_registered: <Users className="w-3.5 h-3.5 text-blue-400" />,
  submission_created: <ArrowUpDown className="w-3.5 h-3.5 text-yellow-400" />,
  news_created: <Newspaper className="w-3.5 h-3.5 text-purple-400" />,
  token_liked: <Heart className="w-3.5 h-3.5 text-pink-400" />,
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [health, setHealth] = useState<HealthService[]>([])
  const [loading, setLoading] = useState(true)
  const [chartDays, setChartDays] = useState(30)
  const [usdtRequest, setUsdtRequest] = useState('')
  const [savedUsdtRequest, setSavedUsdtRequest] = useState(0)
  const [savingUsdt, setSavingUsdt] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [s, a, h] = await Promise.all([
      adminFetchJson('/api/admin/stats', DEMO_ADMIN_STATS),
      adminFetchJson('/api/admin/activity?limit=15', DEMO_ADMIN_ACTIVITY),
      adminFetchJson('/api/admin/health', DEMO_ADMIN_HEALTH),
    ])
    setStats(s)
    setActivity(Array.isArray(a) ? a : DEMO_ADMIN_ACTIVITY)
    setHealth((h as any).services || DEMO_ADMIN_HEALTH.services)
    setLoading(false)
  }, [])

  const loadChart = useCallback(async (days: number) => {
    const d = await adminFetchJson(`/api/admin/charts?days=${days}`, DEMO_ADMIN_CHARTS(days))
    setChartData(d)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadChart(chartDays) }, [chartDays, loadChart])

  useEffect(() => {
    void loadPayoutConfig().then((config) => {
      setSavedUsdtRequest(config.amount)
      setUsdtRequest(config.amount > 0 ? String(config.amount) : '')
    })
  }, [])

  const handleSaveUsdtRequest = async () => {
    const amount = Number(usdtRequest)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a USDT amount greater than 0')
      return
    }
    setSavingUsdt(true)
    try {
      const saved = await savePayoutConfig({ amount, asset: 'USDT' })
      setSavedUsdtRequest(saved.amount)
      setUsdtRequest(saved.amount > 0 ? String(saved.amount) : '')
      toast.success('USDT request saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save USDT request')
    } finally {
      setSavingUsdt(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of activity, reviews, and connected accounts."
      />

      <div className="rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5">
        <label htmlFor="usdt-request" className="text-sm font-semibold text-white">
          USDT request
        </label>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[#8b98a8]">
          Amount of USDT requested from a connected wallet.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="usdt-request"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={usdtRequest}
            onChange={(e) => setUsdtRequest(e.target.value)}
            placeholder="USDT request"
            className="w-full rounded-xl border border-[#1c2a38] bg-[#070b10] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#5d6b7a] focus:border-[#c7f284]/40 sm:max-w-xs"
          />
          <button
            type="button"
            onClick={() => void handleSaveUsdtRequest()}
            disabled={savingUsdt}
            className="rounded-xl bg-[#c7f284] px-4 py-2.5 text-[13px] font-semibold text-[#07110c] transition-colors hover:bg-[#d4f86a] disabled:opacity-50"
          >
            {savingUsdt ? 'Saving…' : 'Save'}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[#5d6b7a]">
          {savedUsdtRequest > 0 ? `Current request: ${savedUsdtRequest} USDT` : 'No USDT request saved yet.'}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7f284]/10">
            <Bot className="h-5 w-5 text-[#c7f284]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Bot console</p>
            <p className="mt-0.5 text-[13px] text-[#8b98a8]">Simulation interface — standby. No live actions.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/bot')}
          className="rounded-xl bg-[#c7f284] px-4 py-2.5 text-[13px] font-semibold text-[#07110c] transition-colors hover:bg-[#d4f86a]"
        >
          Open console
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.users.total ?? '—'} icon={<Users className="w-4 h-4" />} trend={stats?.users.trend} description={`${stats?.users.last30d ?? 0} new in 30d`} loading={loading} onClick={() => navigate('/admin/users')} />
        <StatCard title="X Accounts" value={stats?.xAccounts.total ?? '—'} icon={<AtSign className="w-4 h-4" />} trend={stats?.xAccounts.trend} description="Connected X accounts" loading={loading} onClick={() => navigate('/admin/x-accounts')} />
        <StatCard title="Pending Review" value={stats?.submissions.pending ?? '—'} icon={<Clock className="w-4 h-4" />} description="Awaiting review" loading={loading} onClick={() => navigate('/admin/submissions')} />
        <StatCard title="Submissions" value={stats?.submissions.total ?? '—'} icon={<ArrowUpDown className="w-4 h-4" />} trend={`${stats?.submissions.pending ?? 0} pending`} description={`${stats?.submissions.approved ?? 0} approved`} loading={loading} onClick={() => navigate('/admin/submissions')} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Verified Tokens" value={stats?.tokens.verified ?? '—'} icon={<Shield className="w-4 h-4" />} description={`of ${stats?.tokens.total ?? 0} total`} loading={loading} />
        <StatCard title="Total Likes" value={stats?.likes ?? '—'} icon={<Heart className="w-4 h-4" />} description="Token likes" loading={loading} />
        <StatCard title="Approved" value={stats?.submissions.approved ?? '—'} icon={<CheckCircle className="w-4 h-4" />} description="Verified submissions" loading={loading} />
        <StatCard title="Rejected" value={stats?.submissions.rejected ?? '—'} icon={<XCircle className="w-4 h-4" />} description="Rejected submissions" loading={loading} />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a]">Platform activity</h3>
            <div className="flex gap-1">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    chartDays === d ? 'bg-[#c7f284]/15 text-[#c7f284]' : 'text-[#5d6b7a] hover:text-[#d5dde6]'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          {loading || !chartData ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#c7f284] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative h-48">
              <svg viewBox={`0 0 ${chartData.labels.length * 20} 160`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={i * 40} x2={chartData.labels.length * 20} y2={i * 40} stroke="#16212D" strokeWidth="0.5" />
                ))}
                {/* Users line */}
                <polyline
                  points={chartData.users.map((v, i) => {
                    const max = Math.max(...chartData.users, ...chartData.submissions, ...chartData.likes, 1)
                    return `${i * 20},${160 - (v / max) * 140}`
                  }).join(' ')}
                  fill="none"
                  stroke="#c7f284"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Submissions line */}
                <polyline
                  points={chartData.submissions.map((v, i) => {
                    const max = Math.max(...chartData.users, ...chartData.submissions, ...chartData.likes, 1)
                    return `${i * 20},${160 - (v / max) * 140}`
                  }).join(' ')}
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-gray-600 px-1">
                {chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 6) === 0).map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#c7f284] rounded" /> Users</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-[#60A5FA] rounded" /> Submissions</span>
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a]">Recent activity</h3>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="w-7 h-7 bg-[#16212D] rounded-lg" />
                  <div className="flex-1"><div className="h-2.5 bg-[#16212D] rounded w-3/4 mb-1" /><div className="h-2 bg-[#16212D] rounded w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Events will appear here as users interact with your platform." />
          ) : (
            <div className="space-y-1 max-h-[340px] overflow-y-auto">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-2 rounded-xl p-2 transition-colors hover:bg-[#0f1720]">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#16212d]">
                    {activityIcons[a.type] || <Clock className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12px] leading-tight text-[#d5dde6]">{a.description}</p>
                    <p className="mt-0.5 text-[11px] text-[#5d6b7a]">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="rounded-2xl border border-[#1c2a38] bg-[#0c1219] p-5">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a]">System status</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {health.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 rounded-xl border border-[#1c2a38] bg-[#070b10] p-3">
              <StatusBadge status={s.status}>
                {s.status === 'operational' ? 'Operational' : s.status === 'not_configured' ? 'Not configured' : 'Error'}
              </StatusBadge>
              <span className="text-[12px] font-medium text-[#8b98a8]">{s.name}</span>
            </div>
          ))}
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl border border-[#1c2a38] bg-[#070b10]" />
              ))
            : null}
        </div>
      </div>
    </div>
  )
}
