import { useState, useMemo, ReactNode } from 'react'
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
  columns, data, total, page, limit, pages,
  onPageChange, onLimitChange, searchValue, onSearchChange,
  searchPlaceholder, loading, emptyMessage = 'No data found'
}: DataTableProps<T>) {
  return (
    <div className="bg-[#0B1118] border border-[#16212D] rounded-xl overflow-hidden">
      {/* Search + Limit */}
      <div className="p-3 border-b border-[#16212D] flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search...'}
            className="w-full bg-[#060A0E] border border-[#182432] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c7f284]/40 transition-colors"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => { onLimitChange(Number(e.target.value)); onPageChange(1) }}
          className="bg-[#060A0E] border border-[#182432] rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-[11px] text-gray-500">{total} total</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#16212D]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider ${col.className || ''} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#16212D]/50">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-3 ${col.className || ''} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}>
                      <div className="h-3 bg-[#16212D] rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-[#16212D]/50 hover:bg-[#0D151F] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2.5 ${col.className || ''} ${col.hideOnMobile ? 'hidden lg:table-cell' : ''}`}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-3 py-2 border-t border-[#16212D] flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Page {page} of {pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="p-1 rounded hover:bg-[#16212D] text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1 rounded hover:bg-[#16212D] text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
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
                  className={`w-7 h-7 rounded text-[11px] font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-[#c7f284]/15 text-[#c7f284]'
                      : 'text-gray-500 hover:bg-[#16212D] hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="p-1 rounded hover:bg-[#16212D] text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(pages)}
              disabled={page >= pages}
              className="p-1 rounded hover:bg-[#16212D] text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
