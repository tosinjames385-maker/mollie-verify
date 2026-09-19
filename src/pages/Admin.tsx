import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '../context/AuthContext'
import {
  Shield,
  Users,
  FileText,
  Newspaper,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Heart,
  Wallet,
  Settings,
  AlertCircle,
  BarChart2,
  Zap,
  Globe,
  Twitter,
  Bot,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ─────────────────────────────────────────────────────
interface Stats {
  users: { total: number; trend: string; last30d: number }
  xAccounts: { total: number; trend: string; last30d: number }
  wallets: { total: number; trend: string; last30d: number }
  tokens: { total: number; verified: number }
  submissions: { total: number; pending: number; approved: number; rejected: number; last30d: number }
  news: { total: number; pending: number }
  likes: number
}

interface Submission {
  id: string
  token: { symbol: string; name: string; mintAddress: string; imageUrl?: string }
  submitterWallet: string
  submissionType: string
  status: string
  createdAt: string
  notes?: string
}

interface NewsPost {
  id: string
  token: { symbol: string; name: string; imageUrl?: string }
  url: string
  title?: string
  description?: string
  reason?: string
  submittedBy: string
  status: string
  createdAt: string
}

interface AdminUser {
  id: string
  xUserId?: string
  xUsername?: string
  displayName?: string
  avatarUrl?: string
  walletAddress?: string
  email?: string
  isAdmin: boolean
  createdAt: string
  lastSeenAt: string
}

interface ActivityEvent {
  id: string
  type: string
  description: string
  user: string
  timestamp: string
}

interface ServiceHealth {
  name: string
  status: 'operational' | 'error' | 'not_configured'
}

// ─── Helpers ───────────────────────────────────────────────────
const API = '/api'

async function adminFetch(endpoint: string, walletAddress: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': walletAddress,
      ...(options.headers as any),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${res.status})`)
  }
  return res.json()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Avatar({ url, seed, size = 8 }: { url?: string; seed: string; size?: number }) {
  const fallback = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`
  return (
    <img
      src={url || fallback}
      alt={seed}
      className={`w-${size} h-${size} rounded-full object-cover bg-[#16212D] flex-shrink-0`}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback }}
    />
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    approved:    'text-[#c7f284] bg-[#c7f284]/10 border-[#c7f284]/30',
    rejected:    'text-red-400 bg-red-400/10 border-red-400/30',
    operational: 'text-[#c7f284] bg-[#c7f284]/10 border-[#c7f284]/30',
    error:       'text-red-400 bg-red-400/10 border-red-400/30',
    not_configured: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/30'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, trend, color = '#c7f284' }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; trend?: string; color?: string
}) {
  return (
    <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</span>
        <div style={{ color }} className="opacity-70">{icon}</div>
      </div>
      <div className="text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-2 text-[10px]">
          {sub && <span className="text-gray-500">{sub}</span>}
          {trend && <span className={trend.startsWith('+') ? 'text-[#c7f284]' : 'text-red-400'}>{trend} vs prev 30d</span>}
        </div>
      )}
    </div>
  )
}

// ─── Tabs ──────────────────────────────────────────────────────
type Tab = 'overview' | 'bot' | 'submissions' | 'news' | 'users' | 'activity' | 'health'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
  { key: 'bot', label: 'Bot Operations', icon: <Bot className="w-4 h-4" /> },
  { key: 'submissions', label: 'Submissions', icon: <FileText className="w-4 h-4" /> },
  { key: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
  { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { key: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
  { key: 'health', label: 'System', icon: <Settings className="w-4 h-4" /> },
]

// ─── Pagination ────────────────────────────────────────────────
function Pagination({ page, pages, onPrev, onNext }: {
  page: number; pages: number; onPrev: () => void; onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-[#16212D] text-xs text-gray-400">
      <button onClick={onPrev} disabled={page <= 1}
        className="flex items-center gap-1 hover:text-white disabled:opacity-30 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <span>{page} / {pages || 1}</span>
      <button onClick={onNext} disabled={page >= pages}
        className="flex items-center gap-1 hover:text-white disabled:opacity-30 transition-colors">
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────
export const Admin = () => {
  const { publicKey } = useWallet()
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Stats
  const [stats, setStats] = useState<Stats | null>(null)

  // Submissions tab
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [subFilter, setSubFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [subPage, setSubPage] = useState(1)
  const [subPages, setSubPages] = useState(1)
  const [subTotal, setSubTotal] = useState(0)
  const [subSearch, setSubSearch] = useState('')
  const [subLoading, setSubLoading] = useState(false)

  // News tab
  const [news, setNews] = useState<NewsPost[]>([])
  const [newsFilter, setNewsFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [newsPage, setNewsPage] = useState(1)
  const [newsPages, setNewsPages] = useState(1)
  const [newsTotal, setNewsTotal] = useState(0)
  const [newsLoading, setNewsLoading] = useState(false)

  // Users tab
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersPages, setUsersPages] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)

  // Activity tab
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  // Health tab
  const [health, setHealth] = useState<ServiceHealth[]>([])

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const walletAddr = publicKey?.toBase58() || ''

  // ─── Load Stats ─────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!walletAddr) return
    try {
      const data = await adminFetch('/admin/stats', walletAddr)
      setStats(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load stats')
    }
  }, [walletAddr])

  // ─── Load Submissions ────────────────────────────────────────
  const loadSubmissions = useCallback(async (page = 1) => {
    if (!walletAddr) return
    setSubLoading(true)
    try {
      const qs = new URLSearchParams({ status: subFilter, page: String(page), limit: '10', ...(subSearch ? { search: subSearch } : {}) })
      const data = await adminFetch(`/admin/transactions?type=submissions&${qs}`, walletAddr)
      setSubmissions(data.items || [])
      setSubPages(data.pages || 1)
      setSubTotal(data.total || 0)
      setSubPage(page)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load submissions')
    } finally {
      setSubLoading(false)
    }
  }, [walletAddr, subFilter, subSearch])

  // ─── Load News ───────────────────────────────────────────────
  const loadNews = useCallback(async (page = 1) => {
    if (!walletAddr) return
    setNewsLoading(true)
    try {
      const qs = new URLSearchParams({ status: newsFilter, page: String(page), limit: '10' })
      const data = await adminFetch(`/admin/transactions?type=news&${qs}`, walletAddr)
      setNews(data.items || [])
      setNewsPages(data.pages || 1)
      setNewsTotal(data.total || 0)
      setNewsPage(page)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load news')
    } finally {
      setNewsLoading(false)
    }
  }, [walletAddr, newsFilter])

  // ─── Load Users ──────────────────────────────────────────────
  const loadUsers = useCallback(async (page = 1) => {
    if (!walletAddr) return
    setUsersLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '15', ...(usersSearch ? { search: usersSearch } : {}) })
      const data = await adminFetch(`/admin/users?${qs}`, walletAddr)
      setUsers(data.users || [])
      setUsersPages(data.pages || 1)
      setUsersTotal(data.total || 0)
      setUsersPage(page)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [walletAddr, usersSearch])

  // ─── Load Activity ───────────────────────────────────────────
  const loadActivity = useCallback(async () => {
    if (!walletAddr) return
    try {
      const data = await adminFetch('/admin/activity?limit=30', walletAddr)
      setActivity(data)
    } catch {}
  }, [walletAddr])

  // ─── Load Health ─────────────────────────────────────────────
  const loadHealth = useCallback(async () => {
    if (!walletAddr) return
    try {
      const data = await adminFetch('/admin/health', walletAddr)
      setHealth(data.services || [])
    } catch {}
  }, [walletAddr])

  // ─── Initial Load ────────────────────────────────────────────
  useEffect(() => {
    if (!walletAddr) return
    const init = async () => {
      setLoading(true)
      try {
        await Promise.all([loadStats(), loadSubmissions(1), loadNews(1), loadActivity(), loadHealth()])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [walletAddr])

  // Re-load tab data on tab change
  useEffect(() => {
    if (!walletAddr || loading) return
    if (activeTab === 'submissions') loadSubmissions(1)
    if (activeTab === 'news') loadNews(1)
    if (activeTab === 'users') loadUsers(1)
    if (activeTab === 'activity') loadActivity()
    if (activeTab === 'health') loadHealth()
  }, [activeTab])

  useEffect(() => { if (!loading) loadSubmissions(1) }, [subFilter])
  useEffect(() => { if (!loading) loadNews(1) }, [newsFilter])

  const refresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([loadStats(), loadSubmissions(subPage), loadNews(newsPage), loadActivity(), loadHealth()])
      toast.success('Refreshed')
    } finally {
      setRefreshing(false)
    }
  }

  // ─── Actions ─────────────────────────────────────────────────
  const handleUpdateSubmission = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status)
    try {
      await adminFetch(`/admin/submissions/${id}`, walletAddr, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast.success(`Submission ${status}`)
      await Promise.all([loadStats(), loadSubmissions(subPage)])
    } catch (err: any) {
      toast.error(err.message || `Failed to ${status} submission`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateNews = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status)
    try {
      await adminFetch(`/admin/news/${id}`, walletAddr, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast.success(`News ${status}`)
      await Promise.all([loadStats(), loadNews(newsPage)])
    } catch (err: any) {
      toast.error(err.message || `Failed to ${status} news`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleAdmin = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await adminFetch(`/admin/users/${userId}/admin`, walletAddr, { method: 'PATCH' })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: res.isAdmin } : u))
      toast.success(res.isAdmin ? 'Admin granted' : 'Admin revoked')
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle admin')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Guards ──────────────────────────────────────────────────
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-[#06090E] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-[#0B1118] border border-[#16212D] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#c7f284]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Wallet Required</h2>
          <p className="text-gray-400 text-sm">Connect your admin wallet to access the Control Center</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06090E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c7f284] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading Control Center...</p>
        </div>
      </div>
    )
  }

  const activityIcon: Record<string, React.ReactNode> = {
    user_registered:    <Users className="w-4 h-4 text-blue-400" />,
    submission_created: <FileText className="w-4 h-4 text-yellow-400" />,
    news_created:       <Newspaper className="w-4 h-4 text-purple-400" />,
    token_liked:        <Heart className="w-4 h-4 text-pink-400" />,
  }

  return (
    <div className="min-h-screen bg-[#06090E] text-white">
      {/* Header */}
      <div className="border-b border-[#131B26] bg-[#06090E] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#182C1C] border border-[#c7f284]/40 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#c7f284]" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight">Control Center</h1>
              <p className="text-[10px] text-gray-500">Administrator Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authUser && (
              <div className="hidden sm:flex items-center gap-2 bg-[#0B1118] border border-[#16212D] rounded-full px-3 py-1.5">
                <Avatar url={authUser.avatar} seed={authUser.username} size={5} />
                <span className="text-xs text-gray-300 font-medium">{authUser.handle}</span>
              </div>
            )}
            <button
              onClick={refresh}
              className={`p-2 bg-[#0B1118] border border-[#16212D] rounded-xl text-gray-400 hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-4 flex gap-0.5 overflow-x-auto no-scrollbar pb-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === t.key
                  ? 'border-[#c7f284] text-[#c7f284]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'submissions' && stats && stats.submissions.pending > 0 && (
                <span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.submissions.pending}
                </span>
              )}
              {t.key === 'news' && stats && stats.news.pending > 0 && (
                <span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.news.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* ─── OVERVIEW TAB ─────────────────────────────────────── */}
        {activeTab === 'overview' && stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={stats.users.total} sub={`+${stats.users.last30d} this month`} trend={stats.users.trend} />
              <StatCard icon={<Twitter className="w-5 h-5" />} label="X Accounts" value={stats.xAccounts.total} sub={`+${stats.xAccounts.last30d} this month`} trend={stats.xAccounts.trend} color="#1DA1F2" />
              <StatCard icon={<Wallet className="w-5 h-5" />} label="Wallets" value={stats.wallets.total} sub={`+${stats.wallets.last30d} this month`} trend={stats.wallets.trend} color="#9945FF" />
              <StatCard icon={<Globe className="w-5 h-5" />} label="Tokens" value={stats.tokens.total} sub={`${stats.tokens.verified} verified`} color="#00D2B8" />
              <StatCard icon={<FileText className="w-5 h-5" />} label="Submissions" value={stats.submissions.total} sub={`${stats.submissions.pending} pending`} color="#F59E0B" />
              <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Approved" value={stats.submissions.approved} sub={`${stats.submissions.last30d} this month`} />
              <StatCard icon={<Newspaper className="w-5 h-5" />} label="News Posts" value={stats.news.total} sub={`${stats.news.pending} pending`} color="#A78BFA" />
              <StatCard icon={<Heart className="w-5 h-5" />} label="Total Likes" value={stats.likes} color="#F472B6" />
            </div>

            {/* Quick Pending Actions */}
            {stats.submissions.pending > 0 && (
              <div className="bg-[#0B1118] border border-yellow-400/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-bold text-white">{stats.submissions.pending} Pending Submissions</h3>
                  <button onClick={() => setActiveTab('submissions')} className="ml-auto text-xs text-[#c7f284] hover:underline">
                    Review all →
                  </button>
                </div>
                <p className="text-xs text-gray-400">Verification requests waiting for review. Click "Review all" to manage them.</p>
              </div>
            )}
          </>
        )}

        {/* ─── SUBMISSIONS TAB ──────────────────────────────────── */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(['pending', 'approved', 'rejected'] as const).map(f => (
                  <button key={f} onClick={() => setSubFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      subFilter === f ? 'bg-[#182C1C] text-[#c7f284] border border-[#c7f284]/30' : 'text-gray-500 hover:text-white'
                    }`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'pending' && stats ? ` (${stats.submissions.pending})` : ''}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadSubmissions(1)}
                  placeholder="Search token or wallet…"
                  className="w-full bg-[#0B1118] border border-[#16212D] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c7f284]/50"
                />
              </div>
              <span className="text-xs text-gray-500">{subTotal} total</span>
            </div>

            {subLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-[#0B1118] border border-[#16212D] rounded-2xl animate-pulse" />)}
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 bg-[#0B1118] border border-[#16212D] rounded-2xl">
                <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No {subFilter} submissions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map(sub => (
                  <div key={sub.id} className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 flex items-start gap-3">
                    <Avatar url={(sub as any).imageUrl} seed={(sub as any).tokenSymbol || sub.id} size={10} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-sm">{(sub as any).tokenSymbol || '—'}</span>
                        <span className="text-xs text-gray-500">{(sub as any).tokenName}</span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mb-1 truncate">
                        {((sub as any).submittedBy || sub.submitterWallet || '').slice(0, 20)}…
                      </div>
                      {(sub as any).notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{(sub as any).notes}</p>}
                      <div className="text-[10px] text-gray-600 mt-1">{timeAgo(sub.createdAt)}</div>
                    </div>
                    {sub.status === 'pending' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleUpdateSubmission(sub.id, 'approved')}
                          disabled={actionLoading === sub.id + 'approved'}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#182C1C] text-[#c7f284] border border-[#c7f284]/30 rounded-xl text-xs font-semibold hover:bg-[#1E3A22] transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateSubmission(sub.id, 'rejected')}
                          disabled={actionLoading === sub.id + 'rejected'}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-400/30 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!subLoading && <Pagination page={subPage} pages={subPages} onPrev={() => loadSubmissions(subPage - 1)} onNext={() => loadSubmissions(subPage + 1)} />}
          </div>
        )}

        {/* ─── NEWS TAB ─────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['pending', 'approved', 'rejected'] as const).map(f => (
                  <button key={f} onClick={() => setNewsFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      newsFilter === f ? 'bg-[#182C1C] text-[#c7f284] border border-[#c7f284]/30' : 'text-gray-500 hover:text-white'
                    }`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === 'pending' && stats ? ` (${stats.news.pending})` : ''}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-gray-500">{newsTotal} total</span>
            </div>

            {newsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-[#0B1118] border border-[#16212D] rounded-2xl animate-pulse" />)}
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-16 bg-[#0B1118] border border-[#16212D] rounded-2xl">
                <Newspaper className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No {newsFilter} news posts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {news.map(item => (
                  <div key={item.id} className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4 flex items-start gap-3">
                    <Avatar url={(item as any).imageUrl} seed={(item as any).tokenSymbol || item.id} size={10} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-sm">{(item as any).tokenSymbol || '—'}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      {(item as any).notes && (
                        <a href={String((item as any).notes).startsWith('http') ? (item as any).notes : '#'}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#c7f284] hover:underline truncate block mb-1 max-w-xs">
                          {(item as any).notes}
                        </a>
                      )}
                      <div className="text-[11px] text-gray-500 font-mono">
                        {((item as any).submittedBy || '').slice(0, 20)}…
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1">{timeAgo(item.createdAt)}</div>
                    </div>
                    {item.status === 'pending' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleUpdateNews(item.id, 'approved')}
                          disabled={actionLoading === item.id + 'approved'}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#182C1C] text-[#c7f284] border border-[#c7f284]/30 rounded-xl text-xs font-semibold hover:bg-[#1E3A22] transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateNews(item.id, 'rejected')}
                          disabled={actionLoading === item.id + 'rejected'}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-400/30 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!newsLoading && <Pagination page={newsPage} pages={newsPages} onPrev={() => loadNews(newsPage - 1)} onNext={() => loadNews(newsPage + 1)} />}
          </div>
        )}

        {/* ─── USERS TAB ────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={usersSearch}
                  onChange={e => setUsersSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadUsers(1)}
                  placeholder="Search user, wallet, email…"
                  className="w-full bg-[#0B1118] border border-[#16212D] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c7f284]/50"
                />
              </div>
              <span className="text-xs text-gray-500">{usersTotal} users</span>
            </div>

            {usersLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-14 bg-[#0B1118] border border-[#16212D] rounded-xl animate-pulse" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 bg-[#0B1118] border border-[#16212D] rounded-2xl">
                <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No users found</p>
              </div>
            ) : (
              <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl overflow-hidden">
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-[#16212D] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>User</span>
                  <span>Wallet</span>
                  <span>Email</span>
                  <span>Joined</span>
                  <span>Admin</span>
                </div>
                {users.map((u, idx) => (
                  <div key={u.id}
                    className={`flex sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center px-4 py-3 ${idx < users.length - 1 ? 'border-b border-[#16212D]/50' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar url={u.avatarUrl} seed={u.xUsername || u.id} size={8} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {u.displayName || u.xUsername || 'Anonymous'}
                        </div>
                        {u.xUsername && <div className="text-[10px] text-gray-500">@{u.xUsername}</div>}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 truncate hidden sm:block">
                      {u.walletAddress ? `${u.walletAddress.slice(0, 6)}…${u.walletAddress.slice(-4)}` : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate hidden sm:block">{u.email || '—'}</div>
                    <div className="text-[10px] text-gray-500 hidden sm:block">{timeAgo(u.createdAt)}</div>
                    <button
                      onClick={() => handleToggleAdmin(u.id)}
                      disabled={actionLoading === u.id}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-40 ${
                        u.isAdmin
                          ? 'bg-[#182C1C] text-[#c7f284] border-[#c7f284]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30'
                          : 'bg-[#111B25] text-gray-400 border-gray-700 hover:bg-[#182C1C] hover:text-[#c7f284] hover:border-[#c7f284]/30'
                      }`}
                    >
                      {u.isAdmin ? 'Admin ✓' : 'Grant'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!usersLoading && <Pagination page={usersPage} pages={usersPages} onPrev={() => loadUsers(usersPage - 1)} onNext={() => loadUsers(usersPage + 1)} />}
          </div>
        )}

        {/* ─── ACTIVITY TAB ─────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="space-y-2">
            {activity.length === 0 ? (
              <div className="text-center py-16 bg-[#0B1118] border border-[#16212D] rounded-2xl">
                <Activity className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl divide-y divide-[#16212D]/50">
                {activity.map(evt => (
                  <div key={evt.id + evt.type} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 bg-[#111B25] rounded-xl flex items-center justify-center flex-shrink-0">
                      {activityIcon[evt.type] || <Activity className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white">{evt.description}</p>
                      <p className="text-[10px] text-gray-500">{evt.user}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">{timeAgo(evt.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── HEALTH TAB ───────────────────────────────────────── */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#16212D]">
                <h3 className="text-sm font-bold text-white">System Services</h3>
              </div>
              {health.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">No health data</div>
              ) : (
                <div className="divide-y divide-[#16212D]/50">
                  {health.map(svc => (
                    <div key={svc.name} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${svc.status === 'operational' ? 'bg-[#c7f284]' : svc.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                        <span className="text-sm text-white">{svc.name}</span>
                      </div>
                      <StatusBadge status={svc.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Environment</h3>
              <div className="space-y-2">
                {[
                  { label: 'Supabase URL', value: 'Configured ✓', ok: true },
                  { label: 'X OAuth', value: health.find(s => s.name === 'X OAuth')?.status === 'operational' ? 'Configured ✓' : 'Not Configured', ok: health.find(s => s.name === 'X OAuth')?.status === 'operational' },
                  { label: 'Database', value: health.find(s => s.name === 'Database')?.status === 'operational' ? 'Connected ✓' : 'Error', ok: health.find(s => s.name === 'Database')?.status === 'operational' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-semibold ${row.ok ? 'text-[#c7f284]' : 'text-red-400'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B1118] border border-[#16212D] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Admin Wallet
              </h3>
              <div className="font-mono text-xs text-gray-300 bg-[#060A0E] rounded-xl px-3 py-2 break-all">
                {walletAddr}
              </div>
              <p className="text-[10px] text-gray-600 mt-2">This wallet must have <code>isAdmin: true</code> in the database to access the Control Center.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
