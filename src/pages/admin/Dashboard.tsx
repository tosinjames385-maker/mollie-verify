import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, AtSign, Wallet, ArrowUpDown, Shield, Heart,
  Clock, CheckCircle, XCircle, Newspaper
} from 'lucide-react'
import { StatCard } from '../../components/admin/StatCard'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { EmptyState } from '../../components/admin/EmptyState'
import { ErrorState } from '../../components/admin/ErrorState'

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
  const [error, setError] = useState('')
  const [chartDays, setChartDays] = useState(30)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sRes, aRes, hRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/activity?limit=15', { credentials: 'include' }),
        fetch('/api/admin/health', { credentials: 'include' }),
      ])

      if (sRes.status === 401) { setError('Not authenticated. Please sign in with X first.'); setLoading(false); return }
      if (sRes.status === 403) { setError('Admin access required. Your account does not have admin privileges.'); setLoading(false); return }

      const [s, a, h] = await Promise.all([
        sRes.json(),
        aRes.json(),
        hRes.json(),
      ])

      setStats(s)
      setActivity(a)
      setHealth(h.services || [])
    } catch {
      setError('Failed to load dashboard data. Is the server running on port 3001?')
    }
    setLoading(false)
  }, [])

  const loadChart = useCallback(async (days: number) => {
    try {
      const d = await fetch(`/api/admin/charts?days=${days}`, { credentials: 'include' }).then(r => r.ok ? r.json() : Promise.reject())
      setChartData(d)
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadChart(chartDays) }, [chartDays, loadChart])

  if (error) return <div className="p-4 lg:p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Overview of your application's activity and connected accounts.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Users" value={stats?.users.total ?? '—'} icon={<Users className="w-4 h-4" />} trend={stats?.users.trend} description={`${stats?.users.last30d ?? 0} new in 30d`} loading={loading} onClick={() => navigate('/admin/users')} />
        <StatCard title="X Accounts" value={stats?.xAccounts.total ?? '—'} icon={<AtSign className="w-4 h-4" />} trend={stats?.xAccounts.trend} description="Connected X accounts" loading={loading} onClick={() => navigate('/admin/x-accounts')} />
        <StatCard title="Wallets" value={stats?.wallets.total ?? '—'} icon={<Wallet className="w-4 h-4" />} trend={stats?.wallets.trend} description="Connected wallets" loading={loading} onClick={() => navigate('/admin/wallets')} />
        <StatCard title="Submissions" value={stats?.submissions.total ?? '—'} icon={<ArrowUpDown className="w-4 h-4" />} trend={`${stats?.submissions.pending ?? 0} pending`} description={`${stats?.submissions.approved ?? 0} approved`} loading={loading} onClick={() => navigate('/admin/transactions')} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Verified Tokens" value={stats?.tokens.verified ?? '—'} icon={<Shield className="w-4 h-4" />} description={`of ${stats?.tokens.total ?? 0} total`} loading={loading} />
        <StatCard title="Total Likes" value={stats?.likes ?? '—'} icon={<Heart className="w-4 h-4" />} description="Token likes" loading={loading} />
        <StatCard title="Pending Review" value={stats?.submissions.pending ?? '—'} icon={<Clock className="w-4 h-4" />} description="Awaiting review" loading={loading} />
        <StatCard title="News Pending" value={stats?.news.pending ?? '—'} icon={<Newspaper className="w-4 h-4" />} description="Awaiting moderation" loading={loading} />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#0B1118] border border-[#16212D] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform Activity</h3>
            <div className="flex gap-1">
              {[7, 14, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    chartDays === d ? 'bg-[#c7f284]/15 text-[#c7f284]' : 'text-gray-500 hover:text-gray-300'
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
        <div className="bg-[#0B1118] border border-[#16212D] rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
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
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#0D151F] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-[#16212D] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {activityIcons[a.type] || <Clock className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-300 leading-tight truncate">{a.description}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-[#0B1118] border border-[#16212D] rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">System Status</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {health.map(s => (
            <div key={s.name} className="flex items-center gap-2.5 p-2.5 bg-[#060A0E] rounded-lg border border-[#16212D]">
              <StatusBadge status={s.status}>{s.status === 'operational' ? 'Operational' : s.status === 'not_configured' ? 'Not Configured' : 'Error'}</StatusBadge>
              <span className="text-[11px] text-gray-400 font-medium">{s.name}</span>
            </div>
          ))}
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#060A0E] rounded-lg border border-[#16212D] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
