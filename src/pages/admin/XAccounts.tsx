import { useEffect, useState, useCallback } from 'react'
import { DataTable, Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { DEMO_ADMIN_X_ACCOUNTS, adminFetchJson, paginate } from '../../lib/adminDemo'

interface XAccount {
  id: string
  xUserId: string
  xUsername: string | null
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  lastSeenAt: string
}

export const AdminXAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<XAccount[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    const data = await adminFetchJson<{ accounts: XAccount[]; total: number; pages: number }>(
      `/api/admin/x-accounts?${params}`,
      (() => {
        const paged = paginate(DEMO_ADMIN_X_ACCOUNTS, page, limit, search, (a, q) =>
          (a.xUsername || '').toLowerCase().includes(q) ||
          (a.displayName || '').toLowerCase().includes(q)
        )
        return { accounts: paged.items, total: paged.total, pages: paged.pages }
      })()
    )
    setAccounts(data.accounts || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [page, limit, search])

  useEffect(() => { load() }, [load])

  const columns: Column<XAccount>[] = [
    {
      key: 'account',
      label: 'Account',
      render: (a) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#16212D] overflow-hidden flex-shrink-0">
            {a.avatarUrl ? (
              <img src={a.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-black rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25z" /></svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">@{a.xUsername || '—'}</p>
            <p className="text-[10px] text-gray-500 truncate">{a.displayName || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      render: () => <StatusBadge status="connected">Connected</StatusBadge>,
    },
    {
      key: 'connected',
      label: 'Connected',
      hideOnMobile: true,
      render: (a) => (
        <span className="text-[11px] text-gray-400">
          {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      hideOnMobile: true,
      render: (a) => {
        const diff = Date.now() - new Date(a.lastSeenAt).getTime()
        const mins = Math.floor(diff / 60000)
        const text = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`
        return <span className="text-[11px] text-gray-400">{text}</span>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader title="X Accounts" description="Connected X (Twitter) accounts on your platform." />
      <DataTable
        columns={columns}
        data={accounts as any}
        total={total}
        page={page}
        limit={limit}
        pages={pages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by X username or display name..."
        loading={loading}
        emptyMessage="No X accounts connected"
      />
    </div>
  )
}
