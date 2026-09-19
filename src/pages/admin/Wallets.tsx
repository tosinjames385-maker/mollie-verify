import { useEffect, useState, useCallback } from 'react'
import { DataTable, Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { ErrorState } from '../../components/admin/ErrorState'

interface WalletEntry {
  id: string
  walletAddress: string | null
  xUsername: string | null
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  lastSeenAt: string
  likeCount: number
}

export const AdminWallets: React.FC = () => {
  const [wallets, setWallets] = useState<WalletEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/wallets?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWallets(data.wallets)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Failed to load wallets')
    }
    setLoading(false)
  }, [page, limit, search])

  useEffect(() => { load() }, [load])

  const columns: Column<WalletEntry>[] = [
    {
      key: 'wallet',
      label: 'Wallet',
      render: (w) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#16212D] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-white truncate">
              {w.walletAddress ? `${w.walletAddress.slice(0, 6)}...${w.walletAddress.slice(-4)}` : '—'}
            </p>
            {w.displayName && <p className="text-[10px] text-gray-500 truncate">{w.displayName}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'network',
      label: 'Network',
      hideOnMobile: true,
      render: () => <span className="text-[11px] text-gray-400">Solana</span>,
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: () => <StatusBadge status="connected">Connected</StatusBadge>,
    },
    {
      key: 'likes',
      label: 'Likes',
      hideOnMobile: true,
      render: (w) => <span className="text-[11px] text-gray-300 font-medium">{w.likeCount}</span>,
    },
    {
      key: 'connected',
      label: 'Connected',
      hideOnMobile: true,
      render: (w) => (
        <span className="text-[11px] text-gray-400">
          {new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      hideOnMobile: true,
      render: (w) => {
        const diff = Date.now() - new Date(w.lastSeenAt).getTime()
        const mins = Math.floor(diff / 60000)
        const text = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`
        return <span className="text-[11px] text-gray-400">{text}</span>
      },
    },
  ]

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Wallets</h1>
        <p className="text-xs text-gray-500 mt-0.5">Connected Solana wallets on your platform.</p>
      </div>
      <DataTable
        columns={columns}
        data={wallets as any}
        total={total}
        page={page}
        limit={limit}
        pages={pages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by wallet address or name..."
        loading={loading}
        emptyMessage="No wallets connected"
      />
    </div>
  )
}
