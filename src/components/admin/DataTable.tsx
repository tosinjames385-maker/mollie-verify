import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  total,
  page,
  limit,
  pages,
  onPageChange,
  onLimitChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  loading,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1c2a38] bg-[#0c1219]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#1c2a38] p-4">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d6b7a]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search...'}
            className="w-full rounded-xl border border-[#1c2a38] bg-[#070b10] py-2 pl-9 pr-3 text-[13px] text-white placeholder-[#5d6b7a] outline-none transition-colors focus:border-[#c7f284]/40"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value))
            onPageChange(1)
          }}
          className="cursor-pointer rounded-xl border border-[#1c2a38] bg-[#070b10] px-2.5 py-2 text-[12px] text-[#d5dde6] outline-none"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-[12px] text-[#5d6b7a]">{total} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#1c2a38] bg-[#080d12]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d6b7a] ${col.className || ''} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1c2a38]/60">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 ${col.className || ''} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                    >
                      <div className="h-3 w-2/3 animate-pulse rounded bg-[#16212d]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-[#8b98a8]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-[#1c2a38]/60 transition-colors hover:bg-[#0f1720]">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 ${col.className || ''} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                    >
                      {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between border-t border-[#1c2a38] px-4 py-3 text-[12px]">
          <span className="text-[#5d6b7a]">
            Page {page} of {pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="rounded-lg p-1.5 text-[#5d6b7a] transition-colors hover:bg-[#16212d] hover:text-white disabled:opacity-30"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded-lg p-1.5 text-[#5d6b7a] transition-colors hover:bg-[#16212d] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              let pageNum: number
              if (pages <= 5) pageNum = i + 1
              else if (page <= 3) pageNum = i + 1
              else if (page >= pages - 2) pageNum = pages - 4 + i
              else pageNum = page - 2 + i
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`h-7 w-7 rounded-lg text-[11px] font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-[#c7f284]/15 text-[#c7f284]'
                      : 'text-[#8b98a8] hover:bg-[#16212d] hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="rounded-lg p-1.5 text-[#5d6b7a] transition-colors hover:bg-[#16212d] hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPageChange(pages)}
              disabled={page >= pages}
              className="rounded-lg p-1.5 text-[#5d6b7a] transition-colors hover:bg-[#16212d] hover:text-white disabled:opacity-30"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
