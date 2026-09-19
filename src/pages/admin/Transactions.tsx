import { useEffect, useState, useCallback } from 'react'
import { DataTable, Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { ErrorState } from '../../components/admin/ErrorState'

interface Transaction {
  id: string
  type: 'submission' | 'news'
  status: string
  tokenSymbol: string
  tokenName: string
  mintAddress: string
  imageUrl: string | null
  submittedBy: string | null
  createdAt: string
  notes: string | null
}

export const AdminTransactions: React.FC = () => {
  const [items, setItems] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/admin/transactions?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Failed to load transactions')
    }
    setLoading(false)
  }, [page, limit, search, statusFilter, typeFilter])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string, type: string) => {
    try {
      if (type === 'submission') {
        await fetch(`/api/admin/submissions/${id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        })
      } else {
        await fetch(`/api/admin/news/${id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        })
      }
      load()
    } catch {}
  }

  const handleReject = async (id: string, type: string) => {
    try {
      if (type === 'submission') {
        await fetch(`/api/admin/submissions/${id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' }),
        })
      } else {
        await fetch(`/api/admin/news/${id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' }),
        })
      }
      load()
    } catch {}
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'token',
      label: 'Token',
      render: (t) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#16212D] overflow-hidden flex-shrink-0">
            {t.imageUrl ? (
              <img src={t.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#c7f284]">
                {t.tokenSymbol?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">{t.tokenSymbol}</p>
            <p className="text-[10px] text-gray-500 truncate">{t.tokenName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      hideOnMobile: true,
      render: (t) => (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.type === 'submission' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
          {t.type === 'submission' ? 'Verification' : 'News'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      hideOnMobile: true,
      render: (t) => t.submittedBy ? (
        <span className="font-mono text-[10px] text-gray-400">{t.submittedBy.slice(0, 6)}...{t.submittedBy.slice(-4)}</span>
      ) : <span className="text-gray-600 text-[10px]">—</span>,
    },
    {
      key: 'date',
      label: 'Date',
      hideOnMobile: true,
      render: (t) => (
        <span className="text-[11px] text-gray-400">
          {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (t) => t.status === 'pending' ? (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleApprove(t.id, t.type) }}
            className="px-2 py-0.5 rounded text-[10px] font-medium text-[#c7f284] hover:bg-[#c7f284]/10 transition-colors">
            Approve
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleReject(t.id, t.type) }}
            className="px-2 py-0.5 rounded text-[10px] font-medium text-red-400 hover:bg-red-400/10 transition-colors">
            Reject
          </button>
        </div>
      ) : null,
    },
  ]

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Transactions</h1>
        <p className="text-xs text-gray-500 mt-0.5">Verification submissions and news posts across your platform.</p>
      </div>
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              statusFilter === s ? 'bg-[#c7f284]/15 text-[#c7f284]' : 'text-gray-500 hover:text-gray-300 bg-[#0B1118] border border-[#16212D]'
            }`}
          >
            {s || 'All Status'}
          </button>
        ))}
        <div className="w-px bg-[#16212D]" />
        {['', 'submissions', 'news'].map(t => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              typeFilter === t ? 'bg-[#c7f284]/15 text-[#c7f284]' : 'text-gray-500 hover:text-gray-300 bg-[#0B1118] border border-[#16212D]'
            }`}
          >
            {t || 'All Types'}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={items as any}
        total={total}
        page={page}
        limit={limit}
        pages={pages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by token, wallet, or address..."
        loading={loading}
        emptyMessage="No transactions found"
      />
    </div>
  )
}
