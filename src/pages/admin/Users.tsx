import { useEffect, useState, useCallback } from 'react'
import { DataTable, Column } from '../../components/admin/DataTable'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { ErrorState } from '../../components/admin/ErrorState'

interface User {
  id: string
  walletAddress: string | null
  xUserId: string | null
  xUsername: string | null
  displayName: string | null
  avatarUrl: string | null
  email: string | null
  isAdmin: boolean
  createdAt: string
  lastSeenAt: string
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
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
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Failed to load users')
    }
    setLoading(false)
  }, [page, limit, search])

  useEffect(() => { load() }, [load])

  const handleToggleAdmin = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}/admin`, {
        method: 'PATCH',
        credentials: 'include',
      })
      load()
    } catch {}
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      label: 'User',
      render: (u) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#16212D] overflow-hidden flex-shrink-0">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#c7f284]">
                {(u.displayName || u.xUsername || 'U')[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">{u.displayName || u.xUsername || '—'}</p>
            {u.xUsername && <p className="text-[10px] text-gray-500 truncate">@{u.xUsername}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'wallet',
      label: 'Wallet',
      hideOnMobile: true,
      render: (u) => u.walletAddress ? (
        <span className="font-mono text-[11px] text-gray-400">{u.walletAddress.slice(0, 4)}...{u.walletAddress.slice(-4)}</span>
      ) : <span className="text-gray-600 text-[11px]">—</span>,
    },
    {
      key: 'role',
      label: 'Role',
      hideOnMobile: true,
      render: (u) => u.isAdmin
        ? <StatusBadge status="active">Admin</StatusBadge>
        : <span className="text-[10px] text-gray-500">User</span>,
    },
    {
      key: 'created',
      label: 'Created',
      hideOnMobile: true,
      render: (u) => (
        <span className="text-[11px] text-gray-400">
          {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      hideOnMobile: true,
      render: (u) => (
        <span className="text-[11px] text-gray-400">
          {new Date(u.lastSeenAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleAdmin(u.id) }}
          className="text-[10px] font-medium text-gray-500 hover:text-[#c7f284] transition-colors"
        >
          {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
        </button>
      ),
    },
  ]

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Users</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage registered users and administrators.</p>
      </div>
      <DataTable
        columns={columns}
        data={users as any}
        total={total}
        page={page}
        limit={limit}
        pages={pages}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by name, username, email, or wallet..."
        loading={loading}
        emptyMessage="No users found"
      />
    </div>
  )
}
