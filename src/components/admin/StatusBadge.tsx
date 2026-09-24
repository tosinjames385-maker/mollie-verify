import { ReactNode } from 'react'

interface StatusBadgeProps {
  status: string
  children?: ReactNode
}

const statusStyles: Record<string, string> = {
  approved: 'text-[#c7f284] border-[#c7f284]/25 bg-[#c7f284]/10',
  verified: 'text-[#c7f284] border-[#c7f284]/25 bg-[#c7f284]/10',
  operational: 'text-[#c7f284] border-[#c7f284]/25 bg-[#c7f284]/10',
  connected: 'text-[#c7f284] border-[#c7f284]/25 bg-[#c7f284]/10',
  active: 'text-[#c7f284] border-[#c7f284]/25 bg-[#c7f284]/10',
  pending: 'text-amber-300 border-amber-400/25 bg-amber-400/10',
  rejected: 'text-red-300 border-red-400/25 bg-red-400/10',
  error: 'text-red-300 border-red-400/25 bg-red-400/10',
  disconnected: 'text-[#8b98a8] border-[#1c2a38] bg-[#16212d]',
  not_configured: 'text-amber-300 border-amber-400/25 bg-amber-400/10',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const style = statusStyles[status] || 'text-[#8b98a8] border-[#1c2a38] bg-[#16212d]'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children || status}
    </span>
  )
}
