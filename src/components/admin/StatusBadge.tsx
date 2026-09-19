import { ReactNode } from 'react'

interface StatusBadgeProps {
  status: string
  children?: ReactNode
}

const statusStyles: Record<string, string> = {
  approved: 'text-[#c7f284] border-[#c7f284]/40 bg-[#c7f284]/10',
  verified: 'text-[#c7f284] border-[#c7f284]/40 bg-[#c7f284]/10',
  operational: 'text-[#c7f284] border-[#c7f284]/40 bg-[#c7f284]/10',
  connected: 'text-[#c7f284] border-[#c7f284]/40 bg-[#c7f284]/10',
  active: 'text-[#c7f284] border-[#c7f284]/40 bg-[#c7f284]/10',
  pending: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  rejected: 'text-red-400 border-red-400/40 bg-red-400/10',
  error: 'text-red-400 border-red-400/40 bg-red-400/10',
  disconnected: 'text-gray-400 border-gray-600/40 bg-gray-600/10',
  not_configured: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const style = statusStyles[status] || 'text-gray-400 border-gray-600/40 bg-gray-600/10'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children || status}
    </span>
  )
}
