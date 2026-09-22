import { demoSubmissions } from '../data/demoSubmissions'
import { demoUsers } from '../data/demoUsers'
import { getAdminPasswordHeader } from './adminGate'
import { resolveApiUrl } from './apiBase'

export const DEMO_ADMIN_USERS = demoUsers.slice(0, 10).map((u, i) => ({
  id: u.id,
  walletAddress: u.wallet,
  xUserId: `x-${u.id}`,
  xUsername: u.username,
  displayName: u.displayName,
  avatarUrl: u.avatar,
  email: null as string | null,
  isAdmin: i === 0,
  createdAt: '2026-03-12T10:00:00.000Z',
  lastSeenAt: new Date(Date.now() - i * 3600_000).toISOString(),
}))

export const DEMO_ADMIN_X_ACCOUNTS = DEMO_ADMIN_USERS.map((u) => ({
  id: `xa-${u.id}`,
  xUserId: u.xUserId || u.id,
  xUsername: u.xUsername,
  displayName: u.displayName,
  avatarUrl: u.avatarUrl,
  createdAt: u.createdAt,
  lastSeenAt: u.lastSeenAt,
}))

export const DEMO_ADMIN_ACTIVITY = [
  { id: 'a1', type: 'submission_created', description: 'BOTIFY submitted for verification', user: '@botify', timestamp: new Date(Date.now() - 9 * 3600_000).toISOString() },
  { id: 'a2', type: 'submission_created', description: 'STEVE submitted for verification', user: '@sparkaday', timestamp: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: 'a3', type: 'token_liked', description: 'Smart like added to TBBB', user: '@sunrise', timestamp: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: 'a4', type: 'user_registered', description: 'New reviewer joined via X', user: '@bidgridwin', timestamp: new Date(Date.now() - 26 * 3600_000).toISOString() },
  { id: 'a5', type: 'news_created', description: 'Metadata update posted for SDICE', user: '@sdice', timestamp: new Date(Date.now() - 40 * 3600_000).toISOString() },
  { id: 'a6', type: 'submission_created', description: 'baton submitted for verification', user: '@baton', timestamp: new Date(Date.now() - 12 * 24 * 3600_000).toISOString() },
]

const pending = demoSubmissions.filter((s) => s.status === 'pending').length
const approved = demoSubmissions.filter((s) => s.status === 'approved').length
const rejected = demoSubmissions.filter((s) => s.status === 'rejected').length

export const DEMO_ADMIN_STATS = {
  users: { total: DEMO_ADMIN_USERS.length, trend: '+12%', last30d: 4 },
  xAccounts: { total: DEMO_ADMIN_X_ACCOUNTS.length, trend: '+8%', last30d: 3 },
  wallets: { total: DEMO_ADMIN_USERS.filter((u) => u.walletAddress).length, trend: '+5%', last30d: 2 },
  tokens: { total: demoSubmissions.length, verified: demoSubmissions.filter((s) => s.token.verified).length },
  submissions: { total: demoSubmissions.length, pending, approved, rejected, last30d: demoSubmissions.length },
  news: { total: 3, pending: 1 },
  likes: 184,
}

export const DEMO_ADMIN_HEALTH = {
  services: [
    { name: 'API', status: 'operational' },
    { name: 'Database', status: 'operational' },
    { name: 'X OAuth', status: 'not_configured' },
    { name: 'Solana RPC', status: 'operational' },
  ],
}

export function DEMO_ADMIN_CHARTS(days: number) {
  const labels = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (Math.min(days, 30) - 1 - i))
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  })
  return {
    labels,
    users: labels.map((_, i) => 2 + (i % 4)),
    submissions: labels.map((_, i) => 4 + (i % 6)),
    likes: labels.map((_, i) => 6 + (i % 5)),
  }
}

export const DEMO_ADMIN_SUBMISSIONS = demoSubmissions.map((s) => ({
  id: s.id,
  type: 'submission' as const,
  status: s.status,
  tokenSymbol: s.token.symbol,
  tokenName: s.token.name,
  mintAddress: s.token.mintAddress,
  imageUrl: s.token.imageUrl || null,
  submittedBy: s.submitterX || s.submitterWallet || null,
  createdAt: s.createdAt,
  notes: null as string | null,
}))

export type AdminFetchResult<T> = {
  data: T
  ok: boolean
  status?: number
}

export async function adminFetchJsonResult<T>(url: string, fallback: T): Promise<AdminFetchResult<T>> {
  try {
    const res = await fetch(resolveApiUrl(url), {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...getAdminPasswordHeader(),
      },
    })
    if (!res.ok) return { data: fallback, ok: false, status: res.status }
    const type = res.headers.get('content-type') || ''
    if (!type.includes('application/json')) {
      return { data: fallback, ok: false, status: res.status }
    }
    return { data: (await res.json()) as T, ok: true, status: res.status }
  } catch {
    return { data: fallback, ok: false }
  }
}

export async function adminFetchJson<T>(url: string, fallback: T): Promise<T> {
  const { data } = await adminFetchJsonResult(url, fallback)
  return data
}

export function paginate<T>(items: T[], page: number, limit: number, search: string, matcher: (item: T, q: string) => boolean) {
  const q = search.trim().toLowerCase()
  const filtered = q ? items.filter((item) => matcher(item, q)) : items
  const start = (page - 1) * limit
  return {
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    pages: Math.max(1, Math.ceil(filtered.length / limit)),
  }
}
