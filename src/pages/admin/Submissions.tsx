import { useEffect, useState, useCallback } from 'react'
import { DataTable, Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DEMO_ADMIN_SUBMISSIONS, adminFetchJson, paginate } from '../../lib/adminDemo'

interface AdminSubmission {
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

export const AdminSubmissions: React.FC = () => {
  const [items, setItems] = useState<AdminSubmission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [localItems, setLocalItems] = useState<AdminSubmission[]>(DEMO_ADMIN_SUBMISSIONS)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), type: 'submissions' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    const data = await adminFetchJson<{ items: AdminSubmission[]; total: number; pages: number }>(
      `/api/admin/transactions?${params}`,
      (() => {
        const source = statusFilter ? localItems.filter((i) => i.status === statusFilter) : localItems
        const paged = paginate(source, page, limit, search, (t, q) =>
          t.tokenSymbol.toLowerCase().includes(q) ||
          t.tokenName.toLowerCase().includes(q) ||
          t.mintAddress.toLowerCase().includes(q) ||
          (t.submittedBy || '').toLowerCase().includes(q)
        )
        return { items: paged.items, total: paged.total, pages: paged.pages }
      })()
    )

    setItems(data.items || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [page, limit, search, statusFilter, localItems])

  useEffect(() => { load() }, [load])

  const patchStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {
      // local demo
    }
    setLocalItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  const columns: Column<AdminSubmission>[] = [
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
      key: 'mint',
      label: 'Mint',
      hideOnMobile: true,
      render: (t) => (
        <span className="font-mono text-[10px] text-gray-400">
          {t.mintAddress.slice(0, 4)}...{t.mintAddress.slice(-4)}
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
        <span className="text-[11px] text-gray-400">{t.submittedBy}</span>
      ) : <span className="text-gray-600 text-[10px]">—</span>,
    },
    {
      key: 'date',
      label: 'Date',
      hideOnMobile: true,
      render: (t) => (
        <span className="text-[11px] text-gray-400">
          {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (t) => t.status === 'pending' ? (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); patchStatus(t.id, 'approved') }}
            className="px-2 py-0.5 rounded text-[10px] font-medium text-[#c7f284] hover:bg-[#c7f284]/10 transition-colors">
            Approve
          </button>
          <button onClick={(e) => { e.stopPropagation(); patchStatus(t.id, 'rejected') }}
            className="px-2 py-0.5 rounded text-[10px] font-medium text-red-400 hover:bg-red-400/10 transition-colors">
            Reject
          </button>
        </div>
      ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Submissions" description="Review token verification requests and update their status." />
      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s)
              setPage(1)
            }}
            className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#c7f284]/15 text-[#c7f284]'
                : 'border border-[#1c2a38] bg-[#0c1219] text-[#8b98a8] hover:text-[#d5dde6]'
            }`}
          >
            {s || 'All Status'}
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
        searchPlaceholder="Search by token, wallet, or mint address..."
        loading={loading}
        emptyMessage="No submissions found"
      />
    </div>
  )
}
